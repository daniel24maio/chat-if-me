# @chatifme/mcp-server 🔌

**Servidor MCP (Model Context Protocol) para consulta à base de conhecimento do IFMG Campus Ouro Branco.**

Este pacote expõe o banco de dados PostgreSQL (com a extensão `pgvector` e busca híbrida) como uma ferramenta padronizada no protocolo MCP. Isso permite que qualquer modelo de linguagem compatível (através de um cliente MCP) consulte a base de conhecimento de forma padronizada.

---

## 🛠️ Tecnologias

*   **TypeScript** + **tsup** para build rápido em ESM.
*   **@modelcontextprotocol/sdk** para implementação nativa do protocolo MCP.
*   **pg** (node-postgres) para conexão direta com o banco.
*   **Zod** para validação estrita de esquemas de entrada.

---

## 🔧 Ferramentas Expostas (Tools)

### `search_ifmg_knowledge`

Realiza uma busca híbrida (semântica baseada em embeddings + léxica via Full-Text Search) combinada com **Reciprocal Rank Fusion (RRF)** nos documentos oficiais do campus.

*   **Parâmetros de Entrada**:
    *   `query` (string, obrigatório): Palavras-chave principais para a busca. *Diretiva: Evitar pronomes, artigos e conectivos; focar apenas em termos fundamentais.*
    *   `intent` (enum, obrigatório): Classificação da intenção da busca disposta em 10 categorias estruturais (ex: `ESTAGIO_TCC`, `AVALIACAO_FREQUENCIA`, etc.).
*   **Retorno**:
    *   Até 3 trechos de documentos relevantes (limite configurado como `MAX_RESULTS = 3` para evitar saturação e estouro de contexto na GPU de homelabs) que superaram a nota de corte mínima `MIN_RRF_SCORE = 0.002`, contendo os conteúdos, origens e scores de similaridade RRF.

---

## ⚙️ Variáveis de Ambiente

O servidor MCP lê as seguintes configurações injetadas pelo processo pai:

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://chatifme:chatifme123@localhost:5432/chatifme` | URL de conexão com o PostgreSQL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL da instância do Ollama para geração de embeddings |
| `OLLAMA_EMBED_MODEL` | `bge-m3` | Modelo de embedding a ser utilizado |

---

## 🚀 Desenvolvimento e Build

O servidor MCP foi desenhado para rodar via **transporte STDIO** (entrada e saída padrão), sendo gerenciado como um subprocesso pelo backend da API.

Para compilar o servidor MCP localmente:

```bash
# Instalar dependências (na raiz do monorepo ou no pacote)
npm install

# Compilar em tempo real (modo watch)
npm run dev

# Gerar build de produção
npm run build
```

O comando de build gera o arquivo executável em `dist/index.js`, que é inicializado automaticamente pelo servidor da API Express.
