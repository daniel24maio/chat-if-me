# Chat Assistente Virtual IFMG — Backend API 🎓🔌

**Servidor Express robusto com suporte a RAG clássico, Agente MCP, controle de concorrência e gerenciamento de memória em RAM.**

Este pacote contém o backend da aplicação, desenvolvido com Node.js, Express, TypeScript e tsup, servindo os endpoints de conversação e o processamento de ingestão de documentos.

---

## 🏗️ Arquitetura de Serviços

A lógica central da API é modulada em serviços especializados presentes em `src/services/`, cada um com responsabilidades estritas no pipeline de IA:

*   **`rag.service.ts` (Pipeline RAG Clássico)**: Fluxo determinístico para responder dúvidas acadêmicas. Combina *Query Rewriting*, busca vetorial (1024d) e lexical via *Reciprocal Rank Fusion (RRF)* otimizado com boost por intenção (`CURSO` / `DISCIPLINA_EMENTA`), suporte a penalização ICL por feedback negativo, e streaming SSE resiliente com filtro stateful contra vazamentos de raciocínio (*thinking*).
*   **`mcp_agent.service.ts` (Agente MCP)**: Pipeline dinâmico baseado no Model Context Protocol, gerenciando o subprocesso do servidor MCP de forma autônoma para orquestrar *Tool Calling*. Possui prompt orientado para 10 categorias acadêmicas (distinguindo listagem de período de ementas individuais), heurística de *Force Tool Calling* para perguntas curtas de períodos (ex: `"periodo 7"`), e filtro stateful de `<think>` SSE.
*   **`embedding.service.ts` (Ingestão e Vetorização)**: Processamento de arquivos (PDFs, Word, Excel), pós-processamento semântico de tabelas e matrizes curriculares (`postProcessPDFMatrixText`), chunking semântico domain-driven com tipos fiéis aos documentos (`syllabus` para ementários integrados e `normative` para regulamentos/artigos), injeção automática de contexto global `[Documento: X | Contexto: Y]`, geração de vetores 1024d (`bge-m3`) e persistência no PostgreSQL.
*   **`sanitization.service.ts` (Sanitização Avançada)**: Tratamento profundo em 15 etapas do texto bruto extraído (OCR), removendo caracteres de controle, corrigindo quebras de hífens, limpando rodapés/cabeçalhos institucionais e formatando tabelas Markdown antes da vetorização.
*   **`memory.service.ts` (Memória em RAM)**: Sessões conversacionais gerenciadas na heap do Node.js. Conta com *Garbage Collector* ativo (TTL de 5 min), limitador de segurança LRU (máx. 100 sessões ativas) e resolução automática de correferências nas conversas contínuas.
*   **`fast_path.util.ts` (Bypass Rápido)**: Intercepta saudações (`Olá`, `Bom dia`) enviando respostas estáticas pré-fabricadas instantaneamente, sem consumir VRAM na GPU.
*   **`queue.service.ts` (VRAM Guard - Semáforo)**: Controle de concorrência ativa (`OLLAMA_MAX_CONCURRENT = 2`) que enfileira conexões ativas prevenindo erros de *Out of Memory (OOM)* na GPU.

---

## 🛠️ Funcionalidades Adicionais

*   **Duplo Pipeline de Busca (SSE)**: Roteamento de perguntas otimizado para RAG sequencial e agente autônomo MCP.
*   **Chunking Semântico Domain-Driven**:
    *   `syllabus`: Preserva `[Código + Nome + CH + Ementa + Objetivos + Bibliografia]` 100% integrados em um único chunk com prefixo de contexto de disciplina ou grade curricular.
    *   `normative`: Mantém a integridade estrutural de Artigos (Art.), Parágrafos (§), Incisos e Capítulos de regulamentos acadêmicos.
*   **Busca Híbrida com Boost por Intenção & ICL Dinâmico**:
    *   Boost RRF de `+0.12` para matrizes curriculares em consultas de intenção `CURSO`.
    *   Boost RRF de `+0.30` / `+0.10` para blocos de ementa em consultas de `DISCIPLINA_EMENTA`.
    *   Penalização RRF dinâmica para chunks marcados com feedback negativo pelos usuários.
*   **Filtro Stateful de Bloco `<think>`**: Intercepta e descarta qualquer token de raciocínio de Chain-of-Thought enviado no fluxo `content` pelo Ollama antes da transmissão SSE ao cliente.
*   **Resiliência & Fallback**: Transmissão de status intermediários SSE e resgate gracioso de rascunhos em caso de geração de conteúdo vazia.
*   **API de Feedback**: Endpoint `POST /api/chat/feedback` para captar avaliações (👍/👎) e alimentar o ICL dinâmico.

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
OLLAMA_NUM_CTX=10240
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
