# chatIFme 🎓🤖

**Assistente virtual inteligente do curso de Sistemas de Informação — IFMG Campus Ouro Branco.**

Sistema **Agentic RAG** (Retrieval-Augmented Generation com agentes autônomos) que responde dúvidas de alunos sobre regulamentos, PPC, grade curricular e normas acadêmicas, utilizando o protocolo **MCP (Model Context Protocol)** para que o LLM decida autonomamente quando buscar nos documentos.

> Projeto de TCC — Bacharelado em Sistemas de Informação, IFMG Campus Ouro Branco.

---

## 🏗️ Arquitetura

```
┌───────────────────────────────────────────────────────────────────┐
│                      MONOREPO (npm workspaces)                    │
│                                                                   │
│  ┌──────────────────┐  ┌───────────────────┐  ┌───────────────┐  │
│  │  packages/web     │  │  packages/api      │  │ packages/     │  │
│  │  React + Vite     │  │  Express + TS      │  │ mcp-server    │  │
│  │                   │  │                    │  │               │  │
│  │ • Chat (SSE)      │  │ • /api/chat (RAG)  │  │ • MCP Tool:   │  │
│  │ • Toggle RAG/MCP  │  │ • /api/agent (MCP) │  │   search_     │  │
│  │ • Upload PDFs     │  │ • MCP Client       │  │   ifmg_       │  │
│  │                   │  │ • Tool Calling     │  │   knowledge   │  │
│  └─────────┬────────┘  └──────┬────────┬────┘  └──────┬────────┘  │
│            │ HTTP              │  stdio │               │          │
│            └──────────────────►│◄───────┘               │          │
│                                │                        │          │
│                                ▼                        ▼          │
│                        ┌───────────┐            ┌────────────┐    │
│                        │ PostgreSQL │            │   Ollama    │    │
│                        │ + pgvector │            │  (homelab)  │    │
│                        │  (Docker)  │            │             │    │
│                        └───────────┘            └────────────┘    │
└───────────────────────────────────────────────────────────────────┘
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

## ✨ Funcionalidades

### Chat (Frontend)
- 💬 Interface de chat com identidade visual IFMG (verde `#2F9E41` / vermelho `#CD191E`)
- ⚡ **Streaming de respostas** via Server-Sent Events (SSE) — token a token
- 📚 Exibição das fontes documentais utilizadas na resposta
- 🌙 Dark mode automático (segue preferência do sistema)
- 📱 Layout responsivo (mobile e desktop)
- 🔄 Auto-scroll suave durante streaming
- ✍️ Cursor piscante durante a geração

### Ingestão de Documentos (Admin)
- 📄 Upload de PDF, Word (.docx), Planilhas/Excel (.xlsx, .csv), Imagens e TXT via drag-and-drop (`/embedding`)
- 📊 **Extração e Conversão**: Reconstrução de layout de tabelas via PDF e conversão nativa de planilhas para `Markdown Tables`.
- 🧹 **Serviço de Sanitização Dedicado**: Remoção de artefatos estruturais, cabeçalhos, notas de rodapé e hifenização.
- 👁️ **OCR Nativo**: Leitura automática de imagens e PDFs escaneados via `tesseract.js`
- ✂️ **Chunking Semântico** (1500 caracteres, overlap de 200) — preserva parágrafos e tabelas intactas
- 🔢 Vetorização via Ollama (`nomic-embed-text`)
- 💾 Armazenamento Híbrido no PostgreSQL (`pgvector` + `tsvector`)
- 📋 Listagem de documentos já processados na base de conhecimento
- 🗑️ Exclusão de documentos e de todos os seus fragmentos associados

### Backend (API)
- 🔄 **Query Rewriting & Roteamento de Intenção** — reescrita com expansão de siglas e extração da Tag de Intenção (`[CURSO]`, `[DISCIPLINA]`, etc) para guiar o contexto.
- 🤖 **Agentic RAG (MCP)** — LLM decide autonomamente quando buscar via Tool Calling (agora com suporte à classificação de intenção no prompt).
- 🔀 **Busca Híbrida (RRF)** — combina busca semântica (`pgvector`) com busca léxica por palavras-chave (`tsvector` + `portuguese_unaccent`) usando Reciprocal Rank Fusion.
- 🛡️ System Prompt rigoroso anti-alucinação focado na intenção detectada.
- ❤️ Health check para PostgreSQL, Ollama e MCP na inicialização
- 📝 Logs detalhados de todo o pipeline no terminal

### MCP Server
- 🔧 Ferramenta `search_ifmg_knowledge` exposta via protocolo MCP
- 📡 Transporte stdio (subprocesso gerenciado pelo Express)
- 🔢 Vetorização + busca pgvector encapsuladas como ferramenta padronizada

---

## 📁 Estrutura do Projeto

```
chat-if-me/
├── docker-compose.yml          # PostgreSQL + pgvector
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
│   ├── init.sql                # Schema do banco (pgvector + tabela documents)
│   └── src/
│       ├── server.ts           # Entry point — Express + MCP Client init
│       ├── config/
│       │   ├── database.ts     # Pool de conexão PostgreSQL
│       │   └── ollama.ts       # Integração Ollama (embed, rewrite, stream)
│       ├── controllers/
│       │   ├── chat.controller.ts       # SSE — RAG clássico
│       │   ├── agent.controller.ts      # SSE — Agente MCP
│       │   └── embedding.controller.ts  # Upload de documentos
│       ├── routes/
│       │   ├── chat.routes.ts           # POST /api/chat
│       │   ├── agent.routes.ts          # POST /api/agent
│       │   └── embedding.routes.ts      # POST /api/embedding/upload
│       └── services/
│           ├── rag.service.ts           # Pipeline RAG clássico
│           ├── mcp_agent.service.ts     # Agente MCP + Tool Calling
│           └── embedding.service.ts     # Ingestão (PDF → chunks → vectors)
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
| **Docker** + **Docker Compose** | — | Banco de dados PostgreSQL |
| **Ollama** | ≥ 0.6 | LLM e embeddings (pode rodar remoto) |

### Modelos Ollama necessários

```bash
# No servidor onde o Ollama está rodando:
ollama pull nomic-embed-text     # Embeddings (768 dimensões)
ollama pull qwen3.5:latest       # Geração de respostas + reescrita de queries
```

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/daniel24maio/chat-if-me.git
cd chat-if-me
npm install
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

Isso cria um container PostgreSQL 16 com pgvector e executa o `init.sql` automaticamente.

### 3. Configurar variáveis de ambiente

```bash
cp packages/api/.env.example packages/api/.env
```

Edite o `packages/api/.env`:

```env
# Servidor
PORT=3333

# PostgreSQL (credenciais do docker-compose)
DATABASE_URL=postgresql://chatifme:chatifme123@localhost:5432/chatifme

# Ollama (ajustar IP conforme sua rede)
OLLAMA_BASE_URL=http://192.168.31.50:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=qwen3.5:latest
OLLAMA_REWRITE_MODEL=qwen3.5:latest
```

### 4. Rodar em modo desenvolvimento

```bash
# Terminal 1 — Backend (porta 3333)
npm run dev:api

# Terminal 2 — Frontend (porta 5173)
npm run dev:web
```

### 5. Ingerir documentos

1. Acesse `http://localhost:5173/embedding`
2. Faça upload dos PDFs (PPC, regulamentos, normas)
3. Aguarde o processamento (chunking + vetorização)

### 6. Usar o chat

Acesse `http://localhost:5173` e faça perguntas sobre o curso.

---

## 🔌 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/chat` | Pergunta via RAG clássico (streaming SSE) |
| `POST` | `/api/agent` | Pergunta via Agente MCP (Tool Calling + SSE) |
| `POST` | `/api/embedding/upload` | Upload de PDF/Imagem para ingestão multimodal |
| `GET` | `/api/embedding/documentos` | Lista documentos processados |
| `DELETE`| `/api/embedding/documentos/:filename`| Remove documento e seus chunks |
| `GET` | `/api/health` | Health check da API |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, Vite 8, React Router, CSS puro |
| **Backend** | Express 4, TypeScript 5, tsup |
| **MCP** | @modelcontextprotocol/sdk (Server + Client) |
| **Banco de Dados** | PostgreSQL 16 + pgvector + Full-Text Search (unaccent) |
| **IA / LLM** | Ollama (nomic-embed-text + qwen3.5) |
| **Ingestão/Upload** | Multer (memória) + pdf.js-extract + tesseract.js + mammoth + xlsx |
| **Streaming** | Server-Sent Events (SSE) |
| **Containerização** | Docker Compose |

---

## 📄 Licença

Projeto acadêmico — TCC do curso de Sistemas de Informação, IFMG Campus Ouro Branco.
