# Chat Assistente Virtual IFMG — Backend API 🎓🔌

**Servidor Express robusto com suporte a RAG clássico, Agente MCP, controle de concorrência e gerenciamento de memória em RAM.**

Este pacote contém o backend da aplicação, desenvolvido com Node.js, Express, TypeScript e tsup, servindo os endpoints de conversação e o processamento de ingestão de documentos.

---

## 🏗️ Arquitetura de Serviços

A lógica central da API é modulada em serviços especializados presentes em `src/services/`, cada um com responsabilidades estritas no pipeline de IA:

*   **`rag.service.ts` (Pipeline RAG Clássico)**: Fluxo determinístico para responder dúvidas acadêmicas. Combina *Query Rewriting*, busca vetorial e lexical via *Reciprocal Rank Fusion (RRF)* com `ordinalMap` expandido para até 10 períodos, além de streaming SSE resiliente contra respostas vazias de raciocínio (*thinking*).
*   **`mcp_agent.service.ts` (Agente MCP)**: Pipeline dinâmico baseado no Model Context Protocol, gerenciando o subprocesso do servidor MCP de forma autônoma para orquestrar *Tool Calling*. Possui heurística de *Force Tool Calling* em tempo de execução para perguntas curtas sobre períodos (ex: `"periodo 7"`), além de captura de eventos `thought` SSE para o frontend.
*   **`embedding.service.ts` (Ingestão e Vetorização)**: Processamento de arquivos (PDFs, planilhas), pós-processamento semântico de tabelas e matrizes curriculares em Markdown (`postProcessPDFMatrixText`), chunking semântico adaptativo (suportando do 1º ao 10º período sem fragmentar semestres), geração de vetores 1024d (`bge-m3`) e inserção no banco híbrido do PostgreSQL.
*   **`sanitization.service.ts` (Sanitização Avançada)**: Tratamento profundo do texto bruto extraído (OCR), removendo caracteres de controle, corrigindo palavras hifenizadas indevidamente, limpando rodapés/cabeçalhos institucionais padrão e formatando tabelas Markdown antes do corte (*chunking*).
*   **`memory.service.ts` (Memória em RAM)**: Sessões conversacionais gerenciadas nativamente na heap do Node.js. Conta com *Garbage Collector* ativo (TTL de 5 min), limitador de segurança LRU (máx. 100 sessões ativas) e resolução automática de correferências nas conversas contínuas.
*   **`fast_path.util.ts` (Bypass Rápido)**: Otimização de saudações (`Olá`, `Bom dia`). Detecta interações primárias instantaneamente (via regex + LLM intent) e envia mensagens pré-fabricadas (`STATIC_GREETING_RESPONSE`), economizando processamento de GPU e evitando demoras de inferência no primeiro contato.
*   **`queue.service.ts` (VRAM Guard - Semáforo)**: Mecanismo de controle de concorrência que enfileira conexões ativas na porta do Ollama, garantindo que o limite físico da GPU (ex: max 2 requests simultâneos) seja respeitado, impedindo falhas críticas de sistema por *Out of Memory (OOM)*.

---

## 🛠️ Funcionalidades Adicionais

*   **Duplo Pipeline de Busca (SSE)**: Roteamento de perguntas otimizado para RAG sequencial e agente autônomo MCP.
*   **Force Tool Calling & Heurística de Busca**: Garantia de busca documental automática para perguntas diretas de período ou matriz curricular.
*   **Formatação de Matrizes Curriculares em Markdown**: Pós-processador nativo que preserva linhas de disciplinas e códigos em tabelas alinhadas (`| Período | Código | Disciplina | CH | Pré-requisito |`).
*   **Suporte a 10 Períodos Acadêmicos**: Indexação FTS e fatiamento jurídico ajustados para cursos de até 10 semestres.
*   **Resiliência a Raciocínio (Thinking)**: Filtragem e transmissão de canais `thinking` / `reasoning_content` (`<think>`) com fallback de rascunho.
*   **Status Dinâmicos SSE**: Pushes de status intermediários enviados em tempo real para manter o frontend ciente do progresso interno do pipeline ("Buscando...", "Lendo documentos...").
*   **API de Feedback**: Endpoint `POST /api/chat/feedback` para captar e consolidar avaliações qualitativas (👍/👎) nas respostas geradas.

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
