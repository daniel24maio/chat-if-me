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
│  │ • Upload PDFs     │  │ • MCP Client       │  │   knowledge       │  │
│  │                   │  │ • BullMQ Semaphore  │  │                   │  │
│  └─────────┬────────┘  └──────┬────────┬────┘  └──────┬────────────┘  │
│            │ HTTP              │  stdio │               │              │
│            └──────────────────►│◄───────┘               │              │
│                                │                        │              │
│                          ┌─────┴─────┐          ┌──────┴───────┐     │
│                          │ PostgreSQL │          │    Ollama     │     │
│                          │ + pgvector │          │  (homelab)   │     │
│                          │  (Docker)  │          │              │     │
│                          └─────┬─────┘          └──────────────┘     │
│                                │                                      │
│                          ┌─────┴─────┐                                │
│                          │   Redis    │                                │
│                          │  (BullMQ)  │                                │
│                          └───────────┘                                │
└───────────────────────────────────────────────────────────────────────┘
```

### Duas abordagens de RAG (comparáveis no TCC)

#### 📚 RAG Clássico (`/api/chat`)

```
Pergunta → Query Rewriting → Busca Híbrida (pgvector + FTS via RRF) → LLM Streaming (SSE)
```

Pipeline determinístico onde toda consulta segue um fluxo linear e estruturado em 5 etapas principais:

1. **Etapa 0 — Query Rewriting & Roteamento de Intenção:**
   - A pergunta original do aluno é processada por um LLM leve (utilizando o prompt de sistema `REWRITE_SYSTEM_PROMPT`).
   - O LLM realiza a expansão automática de siglas acadêmicas do IFMG (como `TCC`, `PPC`, `CR`, `IRA`, `AC`, `DP`, etc.) e converte termos coloquiais em linguagem formal/acadêmica, alinhando a busca com o vocabulário oficial dos documentos.
   - Adiciona uma **Tag de Intenção** à consulta: `[CURSO]`, `[DISCIPLINA]`, `[CONTEUDO]` ou `[OUTRAS]`.
   - Se o processo falhar, o sistema aplica um fallback automático utilizando a pergunta original do aluno.

2. **Etapa 1 — Vetorização (Embeddings):**
   - A pergunta reescrita e expandida é convertida em um vetor numérico denso de **1024 dimensões** utilizando o modelo `bge-m3` via Ollama.

3. **Etapa 2 — Busca Híbrida com Reciprocal Rank Fusion (RRF):**
   - Para maximizar a precisão tanto em consultas conceituais (semânticas) quanto em buscas por termos exatos (léxicas), o sistema realiza duas buscas concorrentes no PostgreSQL:
     - **Busca Vetorial (Semântica):** Usa a extensão `pgvector` com o operador de similaridade de cosseno (`<=>`), otimizado por índices HNSW.
     - **Busca Lexical (FTS):** Usa o mecanismo de busca textual do PostgreSQL com indexação `tsvector` + filtro `portuguese_unaccent` e ordenação por relevância usando `ts_rank_cd`.
   - **RRF (Reciprocal Rank Fusion):** Combina os resultados de ambas as buscas aplicando a fórmula matemática:
     $$Score_{RRF} = \alpha \times \frac{1}{k + rank_{sem\hat{a}ntico}} + (1 - \alpha) \times \frac{1}{k + rank_{lexical}}$$
     Configurado com $k = 60$ (constante de suavização) e $\alpha = 0.5$ (equilíbrio idêntico entre busca semântica e lexical). Os 5 melhores trechos resultantes são passados como contexto.

4. **Etapa 3 — Montagem do Prompt RAG & Diretivas Anti-Alucinação:**
   - O sistema constrói o prompt final de sistema inserindo os trechos de documentos retornados na busca híbrida e a tag de intenção classificada.
   - Aplica regras estritas de segurança (*guardrails*): o LLM é instruído a responder exclusivamente com base no contexto, não inventar informações acadêmicas, citar as fontes (arquivos de origem) e responder obrigatoriamente em português do Brasil (`pt-BR`).
   - A pergunta final submetida ao chat é a **pergunta original** enviada pelo usuário, enquanto o contexto e a tag de intenção derivam da versão reescrita, preservando a naturalidade da conversa.

5. **Etapa 4 — LLM Streaming (SSE) & Métricas de Desempenho:**
   - Realiza o streaming da resposta gerada pelo LLM token a token para o frontend via Server-Sent Events (SSE).
   - No encerramento da transmissão, envia um objeto com as métricas detalhadas de latência de cada fase em milissegundos (`rewrite`, `embedding`, `retrieval`, `generation` e `total`).

#### 🤖 Agentic RAG com MCP (`/api/agent`)

```
Pergunta → Ollama (com tools[]) → tool_calls? → MCP callTool → LLM Streaming (SSE)
```

> [!WARNING]
> **Status de Desempenho:** Os resultados desta abordagem de RAG Agêntico no momento **não estão totalmente satisfatórios**. Por utilizar localmente o modelo `qwen3.5:4b`, a capacidade cognitiva de Tool Calling de múltiplos passos e o respeito a instruções sob janelas de contexto saturadas são limitados, gerando falhas eventuais na chamada das ferramentas, estouro de contexto e descumprimento de formatação. O RAG Clássico se mostra muito mais consistente no cenário atual.

Nessa arquitetura agêntica baseada no protocolo MCP (**Model Context Protocol**), o fluxo funciona em 4 etapas principais:

1. **Inicialização do MCP Client & Server (Subprocesso Stdio):**
   - Na subida do servidor Express, o backend inicializa o `mcpClient` e estabelece um canal de comunicação (`StdioClientTransport`) com o servidor MCP (`packages/mcp-server/dist/index.js`), que é executado como um subprocesso em background do Node.js.
   - O client executa `listTools()` para descobrir dinamicamente as ferramentas exportadas pelo servidor e as traduz para a especificação de *Function Calling* (`tools[]`) esperada pela API de Chat do Ollama.

2. **Passo 1 — Primeira Chamada (Decisão e Tool Calling):**
   - O Express envia a pergunta original do aluno para o Ollama com a lista de ferramentas declaradas (sem streaming).
   - O LLM analisa o prompt e decide de forma autônoma se precisa executar uma busca nos documentos. 
     - Para saudações e interações simples, o pipeline detecta localmente no fast-path e envia a mensagem de apresentação estática, encerrando o fluxo.
     - Para perguntas acadêmicas, ele gera um objeto `tool_calls` solicitando a invocação da ferramenta `search_ifmg_knowledge`. Ele deve obrigatoriamente preencher dois parâmetros: `query` (termos chaves/nomes próprios limpos e com siglas expandidas) e `intent` (uma das 10 categorias de intenção acadêmica).

3. **Passo 2 — Execução da Tool via Servidor MCP:**
   - O backend captura a requisição de Tool Calling do Ollama e executa a ferramenta localmente via protocolo chamando `mcpClient.callTool`.
   - Dentro do MCP Server, é executada uma busca híbrida no PostgreSQL associando `pgvector` HNSW (similaridade de cosseno com peso $\alpha = 0.4$) e Full-Text Search com `tsvector` + `portuguese_unaccent`.
   - **Filtro de Lixo Semântico:** Diferente do RAG clássico, o servidor MCP aplica uma nota de corte estrita **`MIN_RRF_SCORE = 0.002`** para descartar trechos irrelevantes de baixo ranking, retornando até 5 resultados para o agente (limite `MAX_RESULTS = 5` para evitar saturação e estouro de contexto na GPU de homelabs).

4. **Passo 3 — Segunda Chamada & Geração Final:**
   - O backend anexa os trechos retornados pela busca ao histórico de mensagens na conversa com a role `tool` e envia o histórico completo de volta ao Ollama.
   - É injetado um prompt de sistema final para reforçar as regras do idioma e a proibição de responder com base em conhecimento externo.
   - O Ollama processa as mensagens sob uma janela de contexto restrita a **2048 tokens** (`num_ctx: 2048`) para economizar VRAM e gera a resposta em streaming SSE direta para o frontend.

### 🗄️ Modelagem do Banco de Dados

A persistência de dados e a busca híbrida são viabilizadas pelo PostgreSQL com a extensão `pgvector`. A estrutura física da tabela principal e de seus índices está modelada da seguinte forma:

```sql
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,                     -- Conteúdo bruto do chunk
  metadata JSONB NOT NULL DEFAULT '{}',      -- Metadados (arquivo, página, tipo de chunking)
  embedding vector(1024) NOT NULL,           -- Vetor denso (bge-m3: 1024 dimensões)
  content_tsv tsvector GENERATED ALWAYS AS ( -- Vetor esparso de FTS unaccent
    to_tsvector('portuguese_unaccent', content)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Estrutura de Índices Físicos
Para garantir buscas rápidas em tempo real (< 100ms) sob cargas de dados acadêmicos:
1. **Índice HNSW (`idx_documents_embedding`):** Configurado com similaridade de cosseno (`vector_cosine_ops`) e parâmetros `m = 16` e `ef_construction = 200`. O HNSW (Hierarchical Navigable Small World) foi preferido em relação ao IVFFlat por oferecer maior precisão e latência reduzida para coleções de dados dinâmicos de médio porte.
2. **Índice GIN FTS (`idx_documents_fts`):** Construído sobre a coluna calculada `content_tsv` para acelerar pesquisas de palavras-chave exatas.
3. **Índice GIN JSONB (`idx_documents_metadata`):** Indexa o campo `metadata` para permitir filtros instantâneos por nome de arquivo ou tipo de documento.

---

### 📝 Engenharia de Prompts (Prompt Engineering)

O comportamento dos modelos de linguagem locais é guiado por três prompts de sistema principais, detalhados a seguir:

#### 1. Query Rewriting (`REWRITE_SYSTEM_PROMPT`)
Utilizado para expandir siglas acadêmicas do IFMG e categorizar a intenção do usuário antes de realizar a busca híbrida:
```text
Você é um assistente de pré-processamento de consultas para um sistema de busca de documentos acadêmicos do IFMG (Instituto Federal de Minas Gerais), Campus Ouro Branco.

Sua tarefa: reescrever a pergunta do usuário para melhorar a busca semântica em documentos acadêmicos.

REGRAS:
1. Classifique a intenção da pergunta e inicie a resposta com uma Tag de Intenção:
   - [CURSO]: Dúvidas sobre o projeto pedagógico, regras gerais, estágios, TCC.
   - [DISCIPLINA]: Dúvidas sobre nomes de matérias, códigos, carga horária, pré-requisitos.
   - [CONTEUDO]: Dúvidas específicas sobre a ementa ou tópicos ensinados dentro de uma disciplina.
   - [OUTRAS]: Dúvidas administrativas, infraestrutura do campus, portarias, calendário.
2. Expanda TODAS as siglas acadêmicas:
   - TCC → Trabalho de Conclusão de Curso
   - PPC → Projeto Pedagógico do Curso
   - CR → Coeficiente de Rendimento
   - ENADE → Exame Nacional de Desempenho de Estudantes
   - TI → Tecnologia da Informação
   - SI → Sistemas de Informação
   - IFMG → Instituto Federal de Minas Gerais
   - NDE → Núcleo Docente Estruturante
   - CEAD → Centro de Educação Aberta e a Distância
   - IRA → Índice de Rendimento Acadêmico
   - AC → Atividades Complementares
   - DP → Dependência (disciplina em dependência)
3. Transforme linguagem coloquial em linguagem formal/acadêmica.
4. Adicione contexto implícito quando cabível (ex: "reprovar" → "critérios de reprovação").
5. Mantenha o sentido original da pergunta.
6. Responda APENAS com a Tag de Intenção seguida da pergunta reescrita, sem aspas. Exemplo: "[DISCIPLINA] qual é a carga horária de cálculo 1?"
```

#### 2. Prompt do RAG Clássico
Montado dinamicamente incluindo os trechos de documentos retornados na busca híbrida e a tag de intenção classificada:
```text
Você é o assistente virtual oficial do IFMG Campus Ouro Branco.

Sua função é responder dúvidas dos alunos sobre regulamentos, PPC (Projeto Pedagógico do Curso), grade curricular, normas acadêmicas e informações do campus.

INTENÇÃO DA PERGUNTA: [{intencao}] (Foque a sua resposta no contexto dessa intenção).

CONTEXTO (trechos dos documentos oficiais do curso):
{contexto}

REGRAS OBRIGATÓRIAS (siga rigorosamente):
1. Use EXCLUSIVAMENTE as informações do CONTEXTO acima.
2. NÃO invente, suponha ou complemente com conhecimento externo.
3. Se a resposta não estiver nos trechos, diga: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG."
4. Cite a fonte (nome do documento) quando possível.

DIRETIVAS OBRIGATÓRIAS DE IDIOMA E FORMATAÇÃO:
- REGRA ABSOLUTA: Você deve responder EXCLUSIVAMENTE em Português do Brasil (pt-BR). Traduza qualquer termo do contexto que esteja em inglês. É proibido responder em inglês ou qualquer outro idioma.
- Seja DIRETO E CONCISO. Não copie longos trechos de texto (como ementas completas ou bibliografias) a menos que o usuário tenha solicitado especificamente.
- Se a intenção for [DISCIPLINA] e o usuário pedir uma lista de disciplinas de um período, cite APENAS os nomes das disciplinas e seus códigos.
- Mantenha a formatação simples. Use listas ('* ') com UM ÚNICO NÍVEL de aninhamento. NUNCA coloque listas dentro de listas.
- Use **negrito** para destacar nomes de disciplinas, códigos ou termos chaves.
- Finalize com uma pergunta breve e proativa (Ex: "Gostaria que eu detalhasse a ementa de alguma dessas disciplinas?").
```

#### 3. Prompt do Agente MCP (`AGENT_SYSTEM_PROMPT`)
Injeta instruções de tool calling para guiar o agente na busca de conhecimento usando o protocolo MCP:
```text
Você é o assistente virtual oficial do IFMG Campus Ouro Branco.

Você tem acesso a uma ferramenta de busca nos documentos oficiais (cursos, PPC, regulamentos, portarias, ementas). USE ESTA FERRAMENTA para responder perguntas sobre regulamentos acadêmicos, PPC, grade curricular, TCC, estágio, atividades complementares e normas gerais do campus.

REGRAS OBRIGATÓRIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge antes de responder perguntas acadêmicas ou sobre normas do campus.
2. Ao gerar o parâmetro 'query' na ferramenta de busca:
   - Extraia APENAS palavras-chave principais e nomes próprios (proibido usar frases completas, pronomes ou conectivos).
   - SEMPRE EXPANDA SIGLAS acadêmicas (ex: TCC -> Trabalho de Conclusão de Curso, PPC -> Projeto Pedagógico do Curso, AC -> Atividades Complementares, IRA -> Índice de Rendimento Acadêmico).
3. Ao gerar o parâmetro 'intent', classifique a intenção estritamente em uma destas 10 categorias:
   - INGRESSO_MATRICULA: Vestibular, SISU, transferências, trancamento, renovação de matrícula.
   - ESTRUTURA_CURSOS: Matriz curricular, PPC, duração de cursos, regras gerais dos cursos do campus.
   - DISCIPLINA_EMENTA: Carga horária específica, pré-requisitos, conteúdo programático, ementas, bibliografia.
   - AVALIACAO_FREQUENCIA: Pontuação, provas, aprovação, limite de faltas (25%), abono/atestados.
   - TCC: Regras, documentação, orientadores e bancas de Trabalho de Conclusão de Curso.
   - ATIVIDADES_EXTRAS: Horas complementares (AAC), pesquisa, extensão, monitoria.
   - ASSISTENCIA_BOLSAS: Assistência estudantil, auxílios (moradia, transporte), bolsas de estudo.
   - INFRA_CAMPUS: Biblioteca, laboratórios, restaurante, horários de funcionamento, setores administrativos.
   - DIREITOS_DEVERES: Regime disciplinar, deveres dos alunos, penalidades, direitos discentes.
   - OUTRAS: Para qualquer outro assunto acadêmico ou geral.
4. Use EXCLUSIVAMENTE as informações retornadas pela ferramenta. Não invente ou complemente com conhecimento externo.
5. FILTRE ESTRITAMENTE: Extraia APENAS a informação pontual que responde à pergunta do usuário. É EXPRESSAMENTE PROIBIDO gerar longos blocos de texto, ementas completas ou eixos curriculares se a pergunta for apenas sobre listar matérias ou verificar carga horária.
6. Se a ferramenta não retornar resultados relevantes, diga: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do seu curso ou o setor correspondente do IFMG."
7. Cite a fonte (nome do documento) quando possível.
8. Para saudações simples (olá, bom dia), responda diretamente sem usar a ferramenta.

DIRETIVAS DE IDIOMA E FORMATAÇÃO:
- REGRA ABSOLUTA: Responda EXCLUSIVAMENTE em Português do Brasil (pt-BR).
- ECONOMIA DE TOKENS: Seja extremamente direto e conciso. Não enrole na introdução ou conclusão.
- FORMATAÇÃO SIMPLES: Use bullet points ('* ') APENAS no nível principal. NUNCA crie listas aninhadas ou recuos secundários.
- Use **negrito** para destacar os termos principais (Ex: nomes das matérias).
```

---

## 📊 Distribuição de VRAM

| Componente | VRAM |
|---|---|
| qwen3.5:4b (geração + reescrita) | ~3.0 GiB |
| bge-m3 (embeddings 1024d) | ~1.2 GiB |
| **Total** | **~4.2 GiB (26%)** |
| **Livre (de 16 GiB)** | **~11.8 GiB** |

> Otimizado para GPUs com 16 GiB de VRAM. Suporta ~10 usuários simultâneos.

---

## ✨ Funcionalidades

### Chat (Frontend)
- 💬 Interface de chat com identidade visual IFMG (verde `#2F9E41` / vermelho `#CD191E`)
- ⚡ **Streaming de respostas** via Server-Sent Events (SSE) — token a token
- 🧠 **Memória de Sessão em RAM** — Mantém o contexto de diálogo e resolve pronomes/referências anafóricas entre perguntas seguidas.
- ⏰ **Modal de Expiração por Inatividade** — Ao atingir 5 minutos de inatividade, o chat bloqueia a digitação (campo de texto e botão de envio) e exibe um modal overlay (com desfoque de fundo e animação suave) para iniciar uma "Nova Conversa" de forma segura.
- 💬 **Status Dinâmicos em Tempo Real** — Exibe o status dinâmico do pipeline ("Analisando pergunta...", "Buscando nos documentos...", "Preparando resposta...") na bolha de digitação.
- 👍/👎 **Feedback de Respostas** — Botões interativos de feedback integrados com o servidor (ocultados na mensagem inicial e avisos do sistema).
- 📚 **Ocultação Condicional de Fontes** — Em modo RAG clássico, as fontes de documentos são ocultadas da interface para manter o visual limpo (sendo registradas no console do navegador), e permanecem visíveis na UI apenas no modo Agente MCP.
- ⏱️ Métricas de timing por etapa do pipeline RAG (rewrite, embedding, retrieval, generation)
- 🌙 Dark mode automático (segue preferência do sistema)
- 📱 Layout responsivo (mobile e desktop)
- 🔄 Auto-scroll suave durante streaming
- ✍️ Cursor piscante durante a geração

### Ingestão de Documentos (Admin)
- 📄 Upload de PDF, Word (.docx), Planilhas/Excel (.xlsx, .csv), Markdown (.md), Imagens e TXT via drag-and-drop (`/embedding`)
- 📊 **Extração e Conversão**: Extração de PDFs preservando a estrutura semântica/markdown gerada por IA espacial via `@llamaindex/liteparse` e conversão nativa de planilhas para `Markdown Tables`.
- 🧹 **Serviço de Sanitização Dedicado**: Limpeza e normalização do texto bruto extraído (implementado em `sanitization.service.ts`), executado em 8 etapas sequenciais:
  1. **Limpeza de OCR**: Remoção de caracteres de controle inválidos, marcação de ordem de byte (BOM) e artefatos de OCR do Tesseract.
  2. **Reconstituição Hifenizada**: Junção inteligente de palavras que foram cortadas com hífen na transição de linhas de PDFs.
  3. **Remoção de Elementos Institucionais**: Filtros baseados em expressões regulares para descartar termos repetitivos como "SERVIÇO PÚBLICO FEDERAL", "MINISTÉRIO DA EDUCAÇÃO", "IFMG Campus Ouro Branco", além de e-mails, endereços e telefones institucionais.
  4. **Poda de Anexos**: Truncamento automático do arquivo ao encontrar expressões de início de anexos ou apêndices (ex: `ANEXO I` no início de linhas), eliminando trechos de formulários em branco que causariam ruído na busca.
  5. **Conversão de Tabelas Markdown**: Normalização de tabelas com pipes (`|`) para linhas de texto corrido, garantindo que códigos e nomes de disciplinas fiquem no mesmo espaço semântico contíguo.
  6. **Limpeza Estrutural**: Remoção de pilcrows (`¶`, `§`), números de página isolados e pontuações repetidas (decorativas).
  7. **Preparação para Chunking Jurídico**: Eliminação de quebras simples de linha que cortam frases ao meio e inserção de quebras duplas (`\n\n`) antes de marcadores de seções (`Art.`, `CAPÍTULO`, `Seção`).
  8. **Normalização Final**: Consolidação de múltiplos espaços em branco e remoção de linhas vazias ou muito curtas (ruído).
- 👁️ **OCR Nativo**: Leitura automática de imagens e PDFs escaneados via `tesseract.js`
- ✂️ **Chunking Semântico Adaptativo** — roteamento automático por tipo de conteúdo:
  - **Jurídico**: Quebra por `Art.` / `CAPÍTULO` / `TÍTULO` / `Seção` — preserva artigo + incisos + parágrafos como unidade atômica
  - **Tabela**: Nunca quebra no meio de uma linha; replica o cabeçalho da tabela no topo de cada sub-chunk
  - **Geral**: Chunking por parágrafo (~2048 chars / ~512 tokens) com overlap de 256 chars
- 🏷️ **Injeção de Contexto Global**: Cada chunk recebe um prefixo automático `[Documento: X | Contexto: Y]` antes da vetorização para evitar OOC (Out of Context) no pgvector
- 🔢 Vetorização via Ollama (`bge-m3`, 1024 dimensões)
- 💾 Armazenamento Híbrido no PostgreSQL (`pgvector` HNSW + `tsvector`)
- 📋 Listagem de documentos já processados na base de conhecimento
- 🗑️ Exclusão de documentos e de todos os seus fragmentos associados

### Backend (API)
- 🧠 **Memória Conversacional em RAM** — Serviço estruturado com `Map` e expiração de TTL a cada 5 minutos, monitorado por garbage collector de ciclo de 30s. Possui proteção de limite de 100 sessões ativas (evicção LRU) e suporte à resolução de pronomes.
- 🚀 **Otimização de Saudações (Fast-Path Bypass)** — Dupla camada de detecção (Local Regex + LLM intent `[GREETING]`) que intercepta saudações/ajuda e responde instantaneamente com uma mensagem de apresentação pré-definida (`STATIC_GREETING_RESPONSE`) simulando digitação, sem acionar o LLM no homelab (latência zero, VRAM liberada e proteção total contra cold-starts da GPU).
- 🔄 **Query Rewriting & Roteamento de Intenção** — reescrita com expansão de siglas e extração da Tag de Intenção (`[CURSO]`, `[DISCIPLINA]`, etc) para guiar o contexto.
- 🤖 **Agentic RAG (MCP)** — LLM decide autonomamente quando buscar via Tool Calling (agora com suporte à classificação de intenção no prompt).
- 🔀 **Busca Híbrida (RRF)** — combina busca semântica (`pgvector` HNSW) com busca léxica por palavras-chave (`tsvector` + `portuguese_unaccent`) usando Reciprocal Rank Fusion.
- 📊 **Métricas e Logs de Feedback** — Endpoint `/api/chat/feedback` estruturado em inglês para captação dos votos em console log no backend.
- 🔐 **Segurança**: Rate limiting (20 req/min chat, 5 req/min upload), autenticação admin via `X-API-Key`, validação de MIME/extensão no upload, CORS restrito.
- 🚦 **Controle de Concorrência (Semáforo de VRAM)**: Mecanismo de controle de concorrência ativa (implementado em `queue.service.ts`) para limitar o número de inferências paralelas enviadas à GPU local:
  - **Funcionamento**: Utiliza uma lógica de semáforo de *acquire/release* encapsulada na função `comControleDeConcorrencia()`.
  - **Limite Concorrente**: Parametrizado por `OLLAMA_MAX_CONCURRENT` (padrão = 2). Se o limite for atingido, novas conexões SSE entram em uma fila de espera em memória com timeout estrito de 120 segundos.
  - **Evita OOM (Out of Memory)**: Garante estabilidade física da GPU em servidores locais ou homelabs, prevenindo crashes do daemon do Ollama sob múltiplos acessos simultâneos de alunos.
- 🛡️ System Prompt rigoroso anti-alucinação focado na intenção detectada.
- 💚 Health check expandido (`/api/health`) com status de DB, Ollama, Redis, fila e memória.
- ⏱️ Métricas de timing por etapa do pipeline RAG enviadas via SSE.
- 📝 Logs detalhados de todo o pipeline no terminal.

### MCP Server
- 🔧 Ferramenta `search_ifmg_knowledge` exposta via protocolo MCP
- 📡 Transporte stdio (subprocesso gerenciado pelo Express)
- 🔢 Vetorização + busca pgvector encapsuladas como ferramenta padronizada

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
- Context window limitado a 8192 tokens por requisição por padrão (configurável via `OLLAMA_NUM_CTX`)
- Modelo de geração padrão é `qwen3.5:4b` (4B parâmetros) — melhor qualidade de geração e aderência a instruções
- Sem autenticação de usuários finais (sistema acadêmico aberto)

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
│       │   ├── ollama.ts       # Integração Ollama (embed, rewrite, stream)
│       │   └── redis.ts        # Conexão Redis para BullMQ
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
│           └── queue.service.ts         # Semáforo de concorrência (BullMQ)
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
OLLAMA_NUM_CTX=8192
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
- `OLLAMA_NUM_CTX`: Limite da janela de contexto para a GPU (ex: 8192)
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
| **Cache / Fila** | Redis 7 + BullMQ (semáforo de concorrência) |
| **IA / LLM** | Ollama (bge-m3 embeddings + qwen3.5:4b) |
| **Ingestão/Upload** | Multer (memória) + @llamaindex/liteparse + tesseract.js + mammoth + xlsx + @langchain/textsplitters |
| **Streaming** | Server-Sent Events (SSE) |
| **Segurança** | express-rate-limit, CORS restrito, admin API key |
| **Containerização** | Docker Compose (PostgreSQL + Redis) |

---

## 📄 Licença

Projeto acadêmico — TCC do curso de Sistemas de Informação, IFMG Campus Ouro Branco.
