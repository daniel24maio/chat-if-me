import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

/**
 * Servidor MCP — chatIFme Knowledge Server
 *
 * Expõe o banco de dados PostgreSQL (pgvector) como uma ferramenta MCP
 * que pode ser invocada por qualquer cliente MCP (ex: o agente no Express).
 *
 * Ferramenta exposta:
 *   search_ifmg_knowledge — busca semântica nos documentos do IFMG
 *
 * Transporte: stdio (o servidor roda como subprocesso)
 *
 * IMPORTANTE: NÃO usar console.log() — stdout é reservado pelo protocolo MCP.
 * Usar console.error() para debug (vai para stderr).
 */

// ---------------------------------------------------------------------------
// Configuração (lê variáveis de ambiente do processo pai)
// ---------------------------------------------------------------------------

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://chatifme:chatifme123@localhost:5432/chatifme";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

/** Parâmetros do Reciprocal Rank Fusion (RRF) */
const RRF_K = 60;
const RRF_ALPHA = 0.5;

/** Número máximo de trechos a retornar */
const MAX_RESULTS = 5;

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

/**
 * Gera embedding de um texto via Ollama (nomic-embed-text).
 */
async function gerarEmbedding(texto: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: texto }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding error: ${response.status}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

/**
 * Busca híbrida (vetorial + FTS) no pgvector usando Reciprocal Rank Fusion (RRF).
 */
async function buscarDocumentos(
  embedding: number[],
  queryTexto: string,
  limite: number
): Promise<{ conteudo: string; origem: string; similaridade: number }[]> {
  const vectorStr = `[${embedding.join(",")}]`;

  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           1 - (embedding <=> $1::vector) AS similaridade,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 20
       ),
       lexical AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ plainto_tsquery('portuguese_unaccent', $2)
         ORDER BY ts_score DESC
         LIMIT 20
       )
     SELECT
       COALESCE(s.id, l.id) AS id,
       COALESCE(s.conteudo, l.conteudo) AS conteudo,
       COALESCE(s.origem, l.origem) AS origem,
       COALESCE(s.similaridade, 0) AS similaridade,
       (
         ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
         ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
       ) AS rrf_score
     FROM semantic s
     FULL OUTER JOIN lexical l ON s.id = l.id
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, queryTexto, limite]
  );

  return result.rows.map((row) => ({
    conteudo: row.conteudo,
    origem: row.origem || "documento desconhecido",
    similaridade: Number(row.rrf_score),
  }));
}

// ---------------------------------------------------------------------------
// Servidor MCP
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "chatifme-knowledge",
  version: "1.0.0",
});

/**
 * Tool: search_ifmg_knowledge
 *
 * Busca semântica nos documentos oficiais do curso de Sistemas de Informação
 * do IFMG Campus Ouro Branco. Vetoriza a query com nomic-embed-text e
 * consulta o PostgreSQL (pgvector) por trechos similares.
 */
server.registerTool(
  "search_ifmg_knowledge",
  {
    description:
      "Busca informações nos documentos oficiais do curso de Sistemas de Informação do IFMG Campus Ouro Branco. " +
      "Use esta ferramenta para responder perguntas sobre regulamentos, PPC (Projeto Pedagógico do Curso), " +
      "grade curricular, normas acadêmicas, carga horária, TCC, estágio e informações do campus. " +
      "Passe a consulta de busca expandida e formal como argumento.",
    inputSchema: {
      query: z
        .string()
        .describe(
          "A consulta de busca. Deve ser formal e com siglas expandidas. " +
          "Exemplo: 'Qual é a carga horária do Trabalho de Conclusão de Curso I?'"
        ),
    },
  },
  async ({ query }) => {
    console.error(`🔍 [MCP] Buscando: "${query}"`);

    try {
      // 1. Vetorizar a query
      const embedding = await gerarEmbedding(query);
      console.error(
        `🔢 [MCP] Embedding gerado (${embedding.length} dimensões)`
      );

      // 2. Buscar no banco (Híbrida)
      const documentos = await buscarDocumentos(embedding, query, MAX_RESULTS);
      console.error(
        `📄 [MCP] ${documentos.length} trechos encontrados (híbrida)`
      );

      // 3. Formatar resultado
      if (documentos.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Nenhum trecho relevante encontrado nos documentos do IFMG para esta consulta.",
            },
          ],
        };
      }

      const resultado = documentos
        .map(
          (doc, i) =>
            `--- Trecho ${i + 1} (fonte: ${doc.origem}, similaridade: ${doc.similaridade.toFixed(2)}) ---\n${doc.conteudo}`
        )
        .join("\n\n");

      console.error(
        `✅ [MCP] Retornando ${documentos.length} trechos ao agente`
      );

      return {
        content: [{ type: "text" as const, text: resultado }],
      };
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ [MCP] Erro na busca: ${msg}`);

      return {
        content: [
          {
            type: "text" as const,
            text: `Erro ao buscar nos documentos: ${msg}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 [MCP Server] chatifme-knowledge iniciado (stdio)");
}

main().catch((err) => {
  console.error("❌ [MCP Server] Falha ao iniciar:", err);
  process.exit(1);
});
