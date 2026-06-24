# Chat Assistente Virtual IFMG — Backend API 🎓🔌

**Servidor Express robusto com suporte a RAG clássico, Agente MCP, controle de concorrência e gerenciamento de memória em RAM.**

Este pacote contém o backend da aplicação, desenvolvido com Node.js, Express, TypeScript e tsup, servindo os endpoints de conversação e o processamento de ingestão de documentos.

---

## 🛠️ Funcionalidades Principais

*   **Duplo Pipeline de Busca (SSE)**:
    *   **RAG Clássico (`/api/chat`)**: Pipeline sequencial de reescrita, vetorização via Ollama (`bge-m3`), busca híbrida no PostgreSQL (`pgvector` HNSW + FTS) e streaming SSE.
    *   **Agente MCP (`/api/agent`)**: Pipeline baseado no Model Context Protocol, gerenciando o subprocesso do servidor MCP de forma autônoma.
*   **Memória Conversacional em RAM** ([memory.service.ts](src/services/memory.service.ts)):
    *   Sessões gerenciadas na heap de memória do Node.js.
    *   TTL automático de **5 minutos** (garbage collector rodando a cada 30 segundos).
    *   Evicção LRU limitada a **100 sessões** para segurança de recursos.
    *   Resolução léxica de pronomes e contexto de entidades acadêmicas.
*   **Otimização de Saudações (Fast-Path Bypass)** ([fast_path.util.ts](src/services/fast_path.util.ts)):
    *   Interceptação de saudações e dúvidas gerais em tempo real (dupla camada: local regex + LLM intent `[GREETING]`).
    *   **Envio de Mensagem Estática (`streamStaticGreeting`)**: Responde instantaneamente com uma mensagem de apresentação pré-definida (`STATIC_GREETING_RESPONSE`) simulando o efeito de digitação, evitando qualquer chamada ao LLM no homelab (eliminando latência, uso de VRAM e falhas por cold-starts).
*   **Status Dinâmicos SSE**:
    *   Pushes de status intermediários enviados em tempo real para manter o frontend ciente do progresso interno do pipeline.
*   **API de Feedback**:
    *   Endpoint `POST /api/chat/feedback` estruturado com corpo em inglês para captar e consolidar votos 👍/👎 no console stdout.
*   **Semáforo de Concorrência (VRAM Guard)**:
    *   Mecanismo de semáforo baseado em fila em memória que limita inferências paralelas na GPU para evitar travamentos (*Out of Memory*).

---

## ⚙️ Configuração (Variáveis de Ambiente)

Crie um arquivo `.env` a partir do template `.env.example`:

```env
PORT=3333
CORS_ORIGINS=http://localhost:5173
ADMIN_API_KEY=sua-chave-secreta-aqui
DATABASE_URL=postgresql://chatifme:chatifme123@localhost:5432/chatifme
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=bge-m3
OLLAMA_LLM_MODEL=qwen3.5:4b
OLLAMA_REWRITE_MODEL=qwen3.5:4b
OLLAMA_NUM_CTX=8192
REDIS_URL=redis://localhost:6379
```

---

## 🚀 Como Executar

### Desenvolvimento

Para iniciar o servidor de desenvolvimento em modo reload automático:

```bash
# A partir da raiz do monorepo:
npm run dev:api

# Ou diretamente dentro da pasta packages/api:
npm run dev
```

O servidor estará disponível em `http://localhost:3333`.

### Build de Produção

Para gerar o bundle javascript compilado:

```bash
# Dentro da pasta packages/api:
npm run build
```

O build otimizado será gerado na pasta `dist/server.js`.
