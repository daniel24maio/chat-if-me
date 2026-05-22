# chatIFme 🎓🤖

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
Pipeline determinístico: toda pergunta passa por todas as etapas.

#### 🤖 Agentic RAG com MCP (`/api/agent`)
```
Pergunta → Ollama (com tools[]) → tool_calls? → MCP callTool → LLM Streaming (SSE)
```
O LLM decide **autonomamente** se precisa buscar nos documentos (via Tool Calling).

---

## 📊 Distribuição de VRAM

| Componente | VRAM |
|---|---|
| qwen3.5:2b-q4_K_M (geração + reescrita) | ~1.9 GiB |
| bge-m3 (embeddings 1024d) | ~1.2 GiB |
| **Total** | **~3.1 GiB (19%)** |
| **Livre (de 16 GiB)** | **~12.8 GiB** |

> Otimizado para GPUs com 16 GiB de VRAM. Suporta ~10 usuários simultâneos.

---

## ✨ Funcionalidades

### Chat (Frontend)
- 💬 Interface de chat com identidade visual IFMG (verde `#2F9E41` / vermelho `#CD191E`)
- ⚡ **Streaming de respostas** via Server-Sent Events (SSE) — token a token
- 📚 Exibição das fontes documentais utilizadas na resposta
- ⏱️ Métricas de timing por etapa do pipeline (rewrite, embedding, retrieval, generation)
- 🌙 Dark mode automático (segue preferência do sistema)
- 📱 Layout responsivo (mobile e desktop)
- 🔄 Auto-scroll suave durante streaming
- ✍️ Cursor piscante durante a geração

### Ingestão de Documentos (Admin)
- 📄 Upload de PDF, Word (.docx), Planilhas/Excel (.xlsx, .csv), Markdown (.md), Imagens e TXT via drag-and-drop (`/embedding`)
- 📊 **Extração e Conversão**: Reconstrução de layout de tabelas via PDF e conversão nativa de planilhas para `Markdown Tables`.
- 🧹 **Serviço de Sanitização Dedicado**: Remoção de cabeçalhos institucionais do IFMG, poda de anexos/formulários, limpeza de OCR e preparação de quebras jurídicas.
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
- 🔄 **Query Rewriting & Roteamento de Intenção** — reescrita com expansão de siglas e extração da Tag de Intenção (`[CURSO]`, `[DISCIPLINA]`, etc) para guiar o contexto.
- 🤖 **Agentic RAG (MCP)** — LLM decide autonomamente quando buscar via Tool Calling (agora com suporte à classificação de intenção no prompt).
- 🔀 **Busca Híbrida (RRF)** — combina busca semântica (`pgvector` HNSW) com busca léxica por palavras-chave (`tsvector` + `portuguese_unaccent`) usando Reciprocal Rank Fusion.
- 🔐 **Segurança**: Rate limiting (20 req/min chat, 5 req/min upload), autenticação admin via `X-API-Key`, validação de MIME/extensão no upload, CORS restrito.
- 🚦 **Controle de Concorrência**: Semáforo BullMQ para serializar requests ao Ollama e evitar OOM na GPU.
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
- Context window limitado a 4096 tokens por requisição (configurável via `OLLAMA_NUM_CTX`)
- Modelo de geração é `qwen3.5:2b` (2B parâmetros) — menor qualidade que modelos maiores
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
ollama pull qwen3.5:2b-q4_K_M  # Geração de respostas (~1.9 GiB VRAM)
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

Isso cria containers para PostgreSQL 16 (com pgvector) e Redis 7, executando o `init.sql` automaticamente na primeira subida.

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
- `REDIS_URL`: URL do servidor Redis

**Frontend (`chatifme-frontend`):**
- `VITE_API_URL`: URL pública da sua API (injetada no momento do **build** do container via argumento).

---

## 🔌 Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/chat` | Pergunta via RAG clássico (streaming SSE) | — |
| `POST` | `/api/agent` | Pergunta via Agente MCP (Tool Calling + SSE) | — |
| `POST` | `/api/embedding/upload` | Upload de documento para ingestão | `X-API-Key` |
| `GET` | `/api/embedding/documentos` | Lista documentos processados | `X-API-Key` |
| `DELETE`| `/api/embedding/documentos/:filename`| Remove documento e seus chunks | `X-API-Key` |
| `GET` | `/api/health` | Health check expandido (DB, Ollama, Redis, fila, memória) | — |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, Vite 8, React Router, Tailwind CSS 4 |
| **Backend** | Express 4, TypeScript 5, tsup |
| **MCP** | @modelcontextprotocol/sdk (Server + Client) |
| **Banco de Dados** | PostgreSQL 16 + pgvector (HNSW) + Full-Text Search (unaccent) |
| **Cache / Fila** | Redis 7 + BullMQ (semáforo de concorrência) |
| **IA / LLM** | Ollama (bge-m3 embeddings + qwen3.5:2b-q4_K_M) |
| **Ingestão/Upload** | Multer (memória) + pdf.js-extract + tesseract.js + mammoth + xlsx |
| **Streaming** | Server-Sent Events (SSE) |
| **Segurança** | express-rate-limit, CORS restrito, admin API key |
| **Containerização** | Docker Compose (PostgreSQL + Redis) |

---

## 📄 Licença

Projeto acadêmico — TCC do curso de Sistemas de Informação, IFMG Campus Ouro Branco.
