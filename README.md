# Chat Assistente Virtual IFMG 🎓🤖

**Assistente virtual inteligente do curso de Sistemas de Informação — IFMG Campus Ouro Branco.**

Sistema **Agentic RAG** (Retrieval-Augmented Generation com agentes autônomos) que responde dúvidas de alunos sobre regulamentos, PPC, grade curricular e normas acadêmicas, utilizando o protocolo **MCP (Model Context Protocol)** para que o LLM decida autonomamente quando buscar nos documentos.

> Projeto de TCC — Bacharelado em Sistemas de Informação, IFMG Campus Ouro Branco.

---

## 🏗️ Arquitetura

```
┌───────────────────────────────────────────────────────────────────────┐
│                      MONOREPO (npm workspaces)                        │
│                                                                       │
│  ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │  packages/web     │  │  packages/api      │  │  packages/        │  │
│  │  React + Vite     │  │  Express + TS      │  │  mcp-server       │  │
│  │                   │  │                    │  │                   │  │
│  │ • Chat (SSE)      │  │ • /api/chat (RAG)  │  │ • MCP Tool:       │  │
│  │ • Toggle RAG/MCP  │  │ • /api/agent (MCP) │  │   search_ifmg_    │  │
│  │ • Badge RAG/Agent │  │ • MCP Client       │  │   knowledge       │  │
│  │ • Upload PDFs     │  │ • VRAM Semaphore   │  │                   │  │
│  └─────────┬────────┘  └──────┬────────┬────┘  └──────┬────────────┘  │
│            │ HTTP              │  stdio │               │              │
│            └──────────────────►│◄───────┘               │              │
│                                │                        │              │
│                          ┌─────┴─────┐          ┌──────┴───────┐     │
│                          │ PostgreSQL │          │    Ollama     │     │
│                          │ + pgvector │          │  (homelab)   │     │
│                          │  (Docker)  │          │              │     │
│                          └───────────┘          └──────────────┘     │
└───────────────────────────────────────────────────────────────────────┘
```

### Duas abordagens de RAG (comparáveis no TCC)

#### 📚 RAG Clássico (`/api/chat`)

```
Pergunta → Query Rewriting → Busca Híbrida Otimizada (pgvector + FTS via RRF Boost) → LLM Streaming com Filtro Stateful (SSE)
```

Pipeline determinístico onde toda consulta segue um fluxo linear e estruturado em 5 etapas principais:

1. **Etapa 0 — Query Rewriting & Roteamento de Intenção:**
   - A pergunta original do aluno é processada por um LLM leve (utilizando o prompt de sistema `REWRITE_SYSTEM_PROMPT`).
   - O LLM realiza a expansão automática de siglas acadêmicas do IFMG (como `TCC`, `PPC`, `CR`, `IRA`, `AC`, `DP`, etc.) e converte termos coloquiais em linguagem formal/acadêmica, alinhando a busca com o vocabulário oficial dos documentos.
   - Classifica a pergunta em uma das **Tags de Intenção**: `[CURSO]`, `[DISCIPLINA]`, `[CONTEUDO]` ou `[OUTRAS]`.
   - Se o processo de reescrita falhar ou omitir a intenção, a função `inferIntentionFromKeywords` calcula a intenção com suporte a ordinais e variações acentuadas (ex: *"disciplinas do 1º período"* $\rightarrow$ `CURSO`).

2. **Etapa 1 — Vetorização (Embeddings):**
   - A pergunta reescrita e expandida é convertida em um vetor numérico denso de **1024 dimensões** utilizando o modelo `bge-m3` via Ollama.

3. **Etapa 2 — Busca Híbrida com RRF (Reciprocal Rank Fusion) Otimizado & Boost por Intenção:**
   - Para maximizar a precisão tanto em consultas conceituais (semânticas) quanto em buscas por termos exatos (léxicas), o sistema realiza duas buscas concorrentes no PostgreSQL:
     - **Busca Vetorial (Semântica):** Usa a extensão `pgvector` com o operador de similaridade de cosseno (`<=>`), otimizado por índices HNSW.
     - **Busca Lexical (FTS Otimizado):** Usa `formatFTSQuery` para filtrar *stopwords* de conversação (*"qual"*, *"quais"*, *"disciplina"*, *"conteúdo"*), expandir numerais ordinais (1º a 10º período), mapear sinonímias (`conteudo` $\leftrightarrow$ `ementa | ementario | programa`) e extrair códigos de disciplinas (`OBBGSIN.016` $\rightarrow$ `obbgsin & 016`).
   - **Fórmula RRF (Reciprocal Rank Fusion):** Combina os resultados aplicando a fórmula:
     $$Score_{RRF} = \alpha \times \frac{1}{k + rank_{sem\hat{a}ntico}} + (1 - \alpha) \times \frac{1}{k + rank_{lexical}}$$
     Configurado com $k = 60$ e $\alpha = 0.5$ (equilíbrio idêntico).
   - **Boost & Penalização por Intenção:**
     - **Intenção `DISCIPLINA_EMENTA`**: Aplica boost em chunks de ementa (`+0.30` se código de disciplina corresponder e tiver `ementa:`, `+0.10` para ementas gerais) e penaliza matrizes curriculares puras (`-0.15`).
     - **Intenção `CURSO` / `ESTRUTURA_CURSOS`**: Aplica boost em chunks de matriz curricular (`+0.12`) e penaliza fichas de ementa sem contexto de período (`-0.05`).
     - **Penalização por Feedback (ICL Dinâmico)**: Chunks com feedbacks negativos dos usuários têm seu score reduzido em $Score_{final} = \frac{Score_{RRF}}{1 + \beta \times N_{negativos}}$.
   - Os 5 melhores trechos resultantes (`MAX_RESULTS = 5`) são selecionados como contexto.

4. **Etapa 3 — Montagem do Prompt RAG, Histórico & Diretivas Anti-Alucinação:**
   - O sistema constrói o prompt final inserindo os trechos de documentos retornados, a tag de intenção e os exemplos *few-shot* aprovados.
   - **Histórico Conversacional:** Injeta as últimas 5 mensagens da sessão (armazenadas na memória RAM) entre o prompt de sistema e a pergunta atual.
   - Aplica regras estritas de segurança (*guardrails*): o LLM responde exclusivamente com base no contexto e responde obrigatoriamente em português do Brasil (`pt-BR`).

5. **Etapa 4 — LLM Streaming com Filtro Stateful de Thinking (SSE) & Métricas:**
   - Transmite a resposta via Server-Sent Events (SSE) token a token.
   - **Filtro Stateful de Bloco `<think>`**: Um acumulador em memória intercepta e descarta qualquer token de raciocínio interno enviado no canal `content` pelo modelo `qwen3.5:4b`, garantindo que apenas a resposta final tratada chegue à interface do usuário.
   - Transmite objetos de status em tempo real e entrega métricas detalhadas de latência de cada fase (`rewrite`, `embedding`, `retrieval`, `generation` e `total`).

#### 🤖 Agentic RAG com MCP (`/api/agent`)

```
Pergunta → Ollama (com tools[]) → tool_calls? → MCP callTool → LLM Streaming com Filtro Stateful (SSE)
```

Nessa arquitetura agêntica baseada no protocolo MCP (**Model Context Protocol**), o fluxo funciona em 4 etapas principais:

1. **Inicialização do MCP Client & Server (Subprocesso Stdio):**
   - Na subida do servidor Express, o backend inicializa o `mcpClient` e estabelece um canal de comunicação (`StdioClientTransport`) com o servidor MCP (`packages/mcp-server/dist/index.js`), executado como um subprocesso em background do Node.js.
   - O client executa `listTools()` para descobrir dinamicamente as ferramentas e as traduz para a especificação de *Function Calling* (`tools[]`) do Ollama.

2. **Passo 1 — Primeira Chamada (Histórico, Decisão e Tool Calling):**
   - O Express recupera a sessão do usuário e injeta as últimas 5 mensagens da conversa no array de mensagens enviado ao Ollama.
   - O LLM analisa a requisição e decide autonomamente se precisa buscar nos documentos.
     - Para saudações simples, o fast-path responde instantaneamente.
     - Para perguntas acadêmicas, ele gera um objeto `tool_calls` solicitando a ferramenta `search_ifmg_knowledge`, preenchendo os parâmetros `query` e `intent` (classificado estritamente entre 10 categorias acadêmicas, com `ESTRUTURA_CURSOS` explicitamente orientado para listagem de disciplinas por período).
   - **Force Tool Calling para Perguntas Curtas:** Para perguntas diretas (ex: `"periodo 7"`, `"disciplinas 5"`), o backend força a execução do `search_ifmg_knowledge` se o LLM não disparar a ferramenta.

3. **Passo 2 — Execução da Tool via Servidor MCP:**
   - O backend captura a requisição de Tool Calling e executa `mcpClient.callTool`.
   - O MCP Server roda a busca híbrida no PostgreSQL (`pgvector` HNSW $\alpha = 0.4$ + Full-Text Search com `portuguese_unaccent`).
   - Aplica a nota de corte estrita **`MIN_RRF_SCORE = 0.002`** e o limite `MAX_RESULTS = 5` para evitar saturação de contexto na GPU.

4. **Passo 3 — Segunda Chamada, Geração Final com Filtro Stateful & Persistência:**
   - Os trechos retornados são anexados ao histórico como mensagens da role `tool`.
   - O Ollama gera a resposta sob janela de contexto otimizada (`num_ctx: 10240`, `num_predict: 2048`, `think: false`).
   - O filtro stateful de `<think>` remove eventuais vazamentos de CoT antes do envio via SSE.
   - A resposta completa é persistida no histórico da sessão RAM.

---

### 🗄️ Modelagem do Banco de Dados

A persistência de dados e a busca híbrida são viabilizadas pelo PostgreSQL 16 com a extensão `pgvector`. A inicialização e o schema oficial do sistema estão consolidados no arquivo **[`init.sql`](file:///c:/projects/chat-if-me/packages/api/init.sql)**:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Tabela principal de documentos vetorizados
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,                     -- Conteúdo do chunk (com prefixo de contexto)
  metadata JSONB NOT NULL DEFAULT '{}',      -- Metadados (filename, chunkIndex, chunkingType, sectionContext)
  embedding vector(1024) NOT NULL,           -- Vetor denso (bge-m3: 1024 dimensões)
  content_tsv tsvector GENERATED ALWAYS AS ( -- Vetor esparso FTS unaccent
    to_tsvector('portuguese_unaccent', content)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de feedbacks para ICL Dinâmico e penalização por RRF
CREATE TABLE IF NOT EXISTS chat_feedbacks (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  feedback VARCHAR(10) NOT NULL CHECK (feedback IN ('up', 'down')),
  chunk_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Estrutura de Índices Físicos
1. **Índice HNSW (`idx_documents_embedding`):** Configurado com similaridade de cosseno (`vector_cosine_ops`), `m = 16` e `ef_construction = 200` para buscas semânticas rápidas (< 50ms).
2. **Índice GIN FTS (`idx_documents_fts`):** Construído sobre a coluna calculada `content_tsv` para acelerar pesquisas léxicas por palavras-chave exatas.
3. **Índice GIN JSONB (`idx_documents_metadata`):** Indexa o campo `metadata` para permiti filtros por nome de arquivo ou tipo de chunking.

---

### 📝 Engenharia de Prompts (Prompt Engineering)

O comportamento dos modelos locais é estruturado em três prompts principais:

#### 1. Query Rewriting (`REWRITE_SYSTEM_PROMPT`)
Converte perguntas coloquiais em buscas acadêmicas e atribui a Tag de Intenção:
```text
Você é um assistente de pré-processamento de consultas para um sistema de busca de documentos acadêmicos do IFMG (Instituto Federal de Minas Gerais), Campus Ouro Branco.

REGRAS:
1. Classifique a intenção da pergunta e inicie a resposta com uma Tag de Intenção:
   - [CURSO]: Dúvidas sobre o projeto pedagógico, matriz curricular, disciplinas por período, regras gerais.
   - [DISCIPLINA]: Dúvidas sobre nomes de matérias, códigos, carga horária, pré-requisitos.
   - [CONTEUDO]: Dúvidas específicas sobre a ementa ou tópicos ensinados dentro de uma disciplina.
   - [OUTRAS]: Dúvidas administrativas, infraestrutura do campus, portarias, calendário.
2. Expanda TODAS as siglas acadêmicas (TCC, PPC, CR, IRA, AC, DP, IFMG, etc.).
3. Transforme linguagem coloquial em linguagem formal/acadêmica.
4. Responda APENAS com a Tag de Intenção seguida da pergunta reescrita. Ex: "[CURSO] quais são as disciplinas do primeiro período de Sistemas de Informação?"
```

#### 2. Prompt do RAG Clássico
Instrui a resposta estritamente baseada no contexto com fallback padronizado:
```text
Você é o assistente virtual oficial do IFMG Campus Ouro Branco.
Responda à dúvida do aluno em Português (pt-BR) usando EXCLUSIVAMENTE o CONTEXTO abaixo.

INTENÇÃO: [{intencao}]
{fewShotBlock}
CONTEXTO:
{contexto}

REGRAS DE RESPOSTA:
1. Responda APENAS com base no contexto. Se a informação não estiver nos trechos, responda exatamente: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG."
2. Se o aluno solicitar EMENTA de disciplina ou detalhes de normas acadêmicas, forneça a resposta COMPLETA E INTEGRAL como consta nos documentos.
3. Use formatação Markdown simples (listas com '* ', destaque em **negrito** para códigos/nomes) e cite a fonte quando possível.
4. Finalize a resposta com uma breve pergunta proativa de acompanhamento.
```

#### 3. Prompt do Agente MCP (`AGENT_SYSTEM_PROMPT`)
Orienta a chamada autônoma da ferramenta `search_ifmg_knowledge` e categoriza as 10 intenções acadêmicas:
```text
Você é o assistente virtual oficial do IFMG Campus Ouro Branco.
USE A FERRAMENTA search_ifmg_knowledge para responder sobre regulamentos, PPC, matriz curricular, Ementas, TCC e normas gerais.

REGRAS OBRIGATÓRIAS:
1. SEMPRE use search_ifmg_knowledge antes de responder dúvidas acadêmicas.
2. Extraia palavras-chave limpas e expanda siglas no parâmetro 'query'.
3. Classifique o parâmetro 'intent' entre: INGRESSO_MATRICULA, ESTRUTURA_CURSOS (matriz curricular e disciplinas por período), DISCIPLINA_EMENTA (ementa/pré-requisito de disciplina específica), AVALIACAO_FREQUENCIA, TCC, ATIVIDADES_EXTRAS, ASSISTENCIA_BOLSAS, INFRA_CAMPUS, DIREITOS_DEVERES, OUTRAS.
4. Responda EXCLUSIVAMENTE em Português do Brasil (pt-BR). NUNCA exiba blocos de raciocínio como 'Thinking Process:' ou '<think>'.
```

---

## 📊 Distribuição de VRAM

| Componente | VRAM |
|---|---|
| qwen3.5:4b (geração + reescrita) | ~3.0 GiB |
| bge-m3 (embeddings 1024d em CPU/GPU) | ~1.2 GiB |
| **Total** | **~4.2 GiB (26%)** |
| **Livre (de 16 GiB)** | **~11.8 GiB** |

---

## ✨ Funcionalidades

### Chat (Frontend)
- 💬 Interface moderna com identidade visual IFMG (verde `#2F9E41` / vermelho `#CD191E`)
- ⚡ **Streaming de respostas** via Server-Sent Events (SSE) com cursor piscante `█`
- 🏷️ **Badge do Modo de Busca no Rodapé**: Exibe visualmente qual modo gerou a resposta (`⚡ Modo: RAG Clássico` ou `🤖 Modo: Agente MCP`), facilitando comparações do TCC.
- 🧠 **Memória de Sessão em RAM**: Resolve pronomes/anapóras e mantém contexto de diálogo por até 5 minutos de inatividade.
- ⏰ **Modal de Expiração de Sessão**: Bloqueia a interface após 5 minutos de inatividade para renovação segura da conversa.
- 💬 **Status Dinâmicos do Pipeline**: Exibe o progresso em tempo real ("Analisando pergunta...", "Buscando nos documentos...", "Preparando resposta...").
- 👍/👎 **Feedback de Respostas**: Captura avaliações do usuário para alimentar a penalização RRF por ICL Dinâmico.
- 📚 **Fontes de Documentos**: Exibidas no modo Agente MCP e logadas no console em modo RAG.
- ⏱️ Métricas de timing detalhadas por etapa (`rewrite`, `embedding`, `retrieval`, `generation`).
- ♿ **Acessibilidade WCAG**: Contraste otimizado (≥4.5:1), navegação por teclado (`focus-visible`), suporte a leitores de tela (`aria-live="polite"`).
- 🌙 Dark mode automático integrado.

### Ingestão de Documentos (Admin)
- 📄 Upload de PDF, Word (.docx), Excel (.xlsx, .csv), Markdown (.md), Imagens e TXT via drag-and-drop (`/embedding`).
- 📊 **Extração Semântica & Matrizes**: Conversão nativa de planilhas para Markdown Tables e pós-processamento de tabelas de disciplinas (`postProcessPDFMatrixText`).
- 🧹 **Sanitização de Texto em 15 Etapas**: Limpeza em `sanitization.service.ts` (remoção de rodapés, hífens de quebra de linha, cabeçalhos, etc.).
- 👁️ **OCR Nativo**: Suporte a imagens e PDFs escaneados via `tesseract.js`.
- ✂️ **Chunking Semântico Domain-Driven**:
  - **`syllabus` (Ementários e Disciplinas)**: Fatiador especializado que mantém **`[Código + Nome + Carga Horária + Ementa + Objetivos + Bibliografia]`** 100% integrados em um único chunk autônomo.
  - **`normative` (Normas e Regulamentos)**: Preserva a estrutura de Artigos (Art.), Parágrafos (§) e Incisos (I, II, III).
  - **`table`**: Réplica cabeçalho de tabelas em cada sub-chunk.
  - **`general`**: Chunking por parágrafos com overlap.
- 🏷️ **Injeção de Contexto Global**: Prefixo automático `[Documento: X | Contexto: Y]` em todos os chunks para evitar descontextualização no pgvector.
- 🔢 Vetorização via Ollama (`bge-m3`, 1024d) e armazenamento no PostgreSQL com índices HNSW + FTS.

### Backend (API)
- 🧠 **Memória Conversacional RAM** com Garbage Collector (TTL 5 min, limite LRU 100 sessões).
- 🚀 **Fast-Path Bypass**: Resposta instantânea a saudações simples sem consumo de GPU.
- 🚦 **VRAM Guard (Semáforo de Concorrência)**: Limita requisições simultâneas ao Ollama (`OLLAMA_MAX_CONCURRENT = 2`) prevenindo erros OOM na GPU.
- 🛡️ **Filtro Stateful de Thinking**: Elimina vazamentos de raciocínio de CoT do `qwen3.5:4b` antes de enviar os tokens ao cliente via SSE.
- 💚 Health check completo (`/api/health`) cobrindo DB, Ollama, Redis, fila e memória.

### MCP Server
- 🔧 Ferramenta `search_ifmg_knowledge` exposta via protocolo MCP.
- 📡 Transporte stdio (subprocesso gerenciado pelo Express).
- 🔢 Vetorização + busca pgvector encapsuladas como ferramenta padronizada com nota de corte RRF (`MIN_RRF_SCORE = 0.002`).

---

## 🔒 Segurança

| Recurso | Detalhes |
|---|---|
| **Rate Limiting** | 20 req/min para `/api/chat` e `/api/agent`; 5 req/min para `/api/embedding` |
| **Autenticação Admin** | Header `X-API-Key` obrigatório em rotas de ingestão (configurável via `ADMIN_API_KEY`) |
| **Validação de Upload** | MIME type + extensão dupla validação; apenas PDF, Word, Excel, CSV, TXT, JPEG, PNG |
| **CORS** | Origens configuráveis via `CORS_ORIGINS` (lista separada por vírgula) |
| **Connection Pooling** | Pool PostgreSQL com max=20 conexões, timeout de 5s |

### Limitações Conhecidas
- Context window de 10240 tokens por padrão (`OLLAMA_NUM_CTX = 10240`).
- Modelo de geração padrão é `qwen3.5:4b` (4B parâmetros) — otimizado para GPUs de 16 GiB VRAM.
- Sem autenticação de alunos finais (sistema de consulta acadêmica pública).

---

## 📁 Estrutura do Projeto

```
chat-if-me/
├── docker-compose.yml          # PostgreSQL + pgvector + Redis
├── package.json                # Workspaces (monorepo)
│
├── packages/mcp-server/        # Servidor MCP (Tool: search_ifmg_knowledge)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # McpServer + StdioServerTransport
│
├── packages/api/               # Backend (Express + TypeScript)
│   ├── .env                    # Variáveis de ambiente (não commitado)
│   ├── .env.example            # Template de configuração
│   ├── init.sql                # Schema do banco (pgvector HNSW + FTS)
│   ├── migrate_bge_m3.sql      # Migração 768d → 1024d (deploys existentes)
│   ├── migrate_hybrid.sql      # Migração para habilitar busca híbrida (deploys existentes)
│   └── src/
│       ├── server.ts           # Entry point — Express + health check + MCP init
│       ├── config/
│       │   ├── database.ts     # Pool de conexão PostgreSQL (max=20)
│       │   └── ollama.ts       # Integração Ollama (embed, rewrite, stream)
│       ├── middlewares/
│       │   ├── rateLimiter.ts  # Rate limiting (chat + upload)
│       │   └── adminAuth.ts    # Autenticação admin via X-API-Key
│       ├── controllers/
│       │   ├── chat.controller.ts       # SSE — RAG clássico + semáforo
│       │   ├── agent.controller.ts      # SSE — Agente MCP + semáforo
│       │   └── embedding.controller.ts  # Upload de documentos
│       ├── routes/
│       │   ├── chat.routes.ts           # POST /api/chat
│       │   ├── agent.routes.ts          # POST /api/agent
│       │   └── embedding.routes.ts      # POST /api/embedding/upload
│       └── services/
│           ├── rag.service.ts           # Pipeline RAG clássico + timing
│           ├── mcp_agent.service.ts     # Agente MCP + Tool Calling
│           ├── embedding.service.ts     # Ingestão (chunking adaptativo)
│           ├── sanitization.service.ts  # Sanitização de texto pós-extração
│           ├── memory.service.ts        # Sessões, TTL e Garbage Collector
│           ├── fast_path.util.ts        # Interceptação de saudações e bypass
│           └── queue.service.ts         # Semáforo de concorrência local
│
└── packages/web/               # Frontend (React + Vite)
    └── src/
        ├── App.tsx             # Router (/ e /embedding)
        ├── components/
        │   └── ChatInterface/  # Chat com toggle RAG ↔ Agente
        └── pages/
            └── EmbeddingPage/  # Admin — upload de documentos
```

---

## 🚀 Como Rodar

### Pré-requisitos

| Ferramenta | Versão | Uso |
|------------|--------|-----|
| **Node.js** | ≥ 20 | Runtime do monorepo |
| **Docker** + **Docker Compose** | — | PostgreSQL + Redis |
| **Ollama** | ≥ 0.6 | LLM e embeddings (pode rodar remoto) |
| **GPU** | ≥ 4 GiB VRAM | Recomendado para geração fluida |

### Modelos Ollama necessários

```bash
# No servidor onde o Ollama está rodando:
ollama pull bge-m3              # Embeddings (1024 dimensões, multilíngue)
ollama pull qwen3.5:4b          # Geração de respostas e reescrita
```

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/daniel24maio/chat-if-me.git
cd chat-if-me
npm install
```

### 2. Subir o banco de dados e Redis

```bash
docker compose up -d
```

Isso cria containers para PostgreSQL 16 (com pgvector) e Redis 7, executando automaticamente os scripts de inicialização (tabela base, busca híbrida FTS e adequação de dimensões) na primeira subida.

### 3. Configurar variáveis de ambiente

**Backend:**
```bash
cp packages/api/.env.example packages/api/.env
```

Edite o `packages/api/.env` (ajuste IPs e credenciais conforme sua rede):

```env
PORT=3333
CORS_ORIGINS=http://localhost:5173
ADMIN_API_KEY=sua-chave-secreta-aqui
DATABASE_URL=postgresql://chatifme:chatifme123@localhost:5432/chatifme
OLLAMA_BASE_URL=http://192.168.31.50:11434
OLLAMA_EMBED_MODEL=bge-m3
OLLAMA_LLM_MODEL=qwen3.5:4b
OLLAMA_REWRITE_MODEL=qwen3.5:4b
OLLAMA_NUM_CTX=10240
REDIS_URL=redis://localhost:6379
```

**Frontend:**
```bash
cp packages/web/.env.example packages/web/.env
```

Edite o `packages/web/.env` para apontar para a sua API local:
```env
VITE_API_URL=http://localhost:3333
```

### 4. Rodar em modo desenvolvimento

Você pode iniciar o backend e o frontend simultaneamente a partir da raiz do projeto:

```bash
npm run dev
```

Ou, se preferir em terminais separados:

```bash
# Terminal 1 — Backend (porta 3333)
npm run dev:api

# Terminal 2 — Frontend (porta 5173)
npm run dev:web
```

### 5. Ingerir documentos

1. Acesse `http://localhost:5173/embedding`
2. Faça upload dos PDFs (PPC, regulamentos, normas)
3. Aguarde o processamento (chunking adaptativo + vetorização)

### 6. Usar o chat

Acesse `http://localhost:5173` e faça perguntas sobre o curso.

---

## 🐳 Deploy para Produção (Docker)

O projeto está configurado para ser 100% agnóstico de ambiente e preparado para deploy via Docker. O GitHub Actions (`deploy.yml`) constrói e publica automaticamente as imagens do Frontend e Backend no **GitHub Container Registry (GHCR)**.

### Variáveis de Ambiente Essenciais
Para rodar em produção (ex: homelab com Nginx/Cloudflare Tunnels), você precisará definir as seguintes variáveis nos seus containers:

**Backend (`chatifme-backend`):**
- `PORT`: Porta do servidor (ex: 3333)
- `CORS_ORIGINS`: Origens permitidas para CORS (ex: `https://chatifme.seu-dominio.com`)
- `ADMIN_API_KEY`: Chave de autenticação para rotas admin
- `DATABASE_URL`: String de conexão do PostgreSQL
- `OLLAMA_BASE_URL`: URL do servidor Ollama no seu homelab
- `OLLAMA_NUM_CTX`: Limite da janela de contexto para a GPU (ex: 10240)
- `REDIS_URL`: URL do servidor Redis

**Frontend (`chatifme-frontend`):**
- `VITE_API_URL`: URL pública da sua API (injetada no momento do **build** do container via argumento).

### 🛠️ Build Manual com Docker

Caso deseje compilar as imagens Docker localmente sem passar pelo CI/CD:

```bash
# Build do Backend
docker build -t chatifme-backend -f Dockerfile.backend .

# Build do Frontend (substitua a URL pela URL pública da sua API se necessário)
docker build --build-arg VITE_API_URL=http://localhost:3333 -t chatifme-frontend -f Dockerfile.frontend .
```

---

## 🔌 Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/chat` | Pergunta via RAG clássico (streaming SSE) | — |
| `POST` | `/api/agent` | Pergunta via Agente MCP (Tool Calling + SSE) | — |
| `POST` | `/api/chat/feedback` | Registra feedback 👍/👎 do usuário sobre a resposta da IA | — |
| `POST` | `/api/embedding/upload` | Upload de documento para ingestão | `X-API-Key` |
| `GET` | `/api/embedding/documentos` | Lista documentos processados | `X-API-Key` |
| `DELETE`| `/api/embedding/documentos/:filename`| Remove documento e seus chunks | `X-API-Key` |
| `GET` | `/api/health` | Health check expandido (DB, Ollama, Redis, fila, memória, sessões) | — |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, Vite 8, React Router, Tailwind CSS 4 |
| **Backend** | Express 4, TypeScript 5, tsup |
| **MCP** | @modelcontextprotocol/sdk (Server + Client) |
| **Banco de Dados** | PostgreSQL 16 + pgvector (HNSW) + Full-Text Search (unaccent) |
| **Cache / Fila** | Memória RAM nativa (Sessões e Semáforo de concorrência) |
| **IA / LLM** | Ollama (bge-m3 embeddings + qwen3.5:4b) |
| **Ingestão/Upload** | Multer (memória) + @llamaindex/liteparse + tesseract.js + mammoth + xlsx + @langchain/textsplitters |
| **Streaming** | Server-Sent Events (SSE) |
| **Segurança** | express-rate-limit, CORS restrito, admin API key |
| **Containerização** | Docker Compose (PostgreSQL + Redis) |

---

## 📄 Licença

Projeto acadêmico — TCC do curso de Sistemas de Informação, IFMG Campus Ouro Branco.
