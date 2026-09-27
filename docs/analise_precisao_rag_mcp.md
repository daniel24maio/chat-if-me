# Análise e Propostas para Elevação da Taxa de Precisão no Modo Agente MCP

**Data:** 27 de Setembro de 2026  
**Projeto:** Chat Assistente Virtual IFMG (Campus Ouro Branco) — TCC  
**Objetivo:** Documentar o diagnóstico técnico e as diretrizes arquiteturais para maximizar a precisão da recuperação e da geração de respostas no Modo Agente MCP (*Model Context Protocol*).

---

## 1. Diagnóstico dos Gargalos Atuais no Modo Agente MCP

Atualmente, o **Modo RAG Clássico** apresenta taxa de acerto prático superior à do **Modo Agente MCP**. A investigação comparativa das implementações revelou os seguintes fatores determinantes:

### 1.1 Assimetria de Heurísticas de Re-ranking
* **No RAG Clássico (`packages/api/src/services/rag.service.ts`):**
  * Bonificação por código de disciplina (+0.15 para códigos como `OBBGSIN.xxx`, elevado a +0.30 se a intenção for ementa).
  * Bonificação para matriz curricular (+0.12 para termos como `PERÍODO COD. DISCIPLINA`).
  * Penalizações cruzadas (ex: reduz o score da ementa em -0.05 se a pergunta for sobre períodos; reduz a matriz em -0.15 se a pergunta for sobre ementa).
* **No Servidor MCP (`packages/mcp-server/src/index.ts`):**
  * Possui apenas um bônus simplificado de ementa (+0.05).
  * Não implementa desempate de matrizes curriculares nem bonificação por códigos de disciplina.

### 1.2 Ausência de Exemplos de Sucesso (ICL Dinâmico) no Agente
* O RAG Clássico busca exemplos avaliados positivamente no banco (`getPositiveExamples`) com base na similaridade de cossenos da dúvida e os injeta como amostras *few-shot*.
* O Agente MCP (`packages/api/src/services/mcp_agent.service.ts`) não injeta amostras *few-shot*, perdendo a oportunidade de ancorar o formato e o rigor da resposta final.

### 1.3 Inconsistência de Esquema (*Schema Mismatch*)
* No System Prompt do agente (`mcp_agent.service.ts`, linha 60), a categoria informada é `TCC`.
* No validador Zod do Servidor MCP (`mcp-server/src/index.ts`, linhas 324-347), o valor permitido no enum é `ESTAGIO_TCC`.
* Caso o modelo gere `intent: "TCC"`, a requisição pode falhar na validação de esquema ou descartar o filtro de intenção.

### 1.4 Vetorização de Palavras-Chave Isoladas no `bge-m3`
* A diretiva do agente proíbe frases completas e exige apenas palavras-chave telegráficas (ex: `"ementa Banco de Dados"`).
* Embora isso funcione bem na busca textual FTS (PostgreSQL), modelos de embedding densos como o `bge-m3` apresentam melhor representação semântica quando recebem sentenças completas ou consultas contextualizadas. No RAG Clássico, a pergunta passa por reescrita formal prévia antes da vetorização.

### 1.5 Omissão Ocasional de Chamada de Ferramenta
* Modelos locais compactos (4B parâmetros, como o `qwen3.5:4b`) ocasionalmente falham na geração da chamada de ferramenta (*Tool Calling*) em perguntas com formulação ambígua, optando por responder diretamente sem consultar a base factual.

---

## 2. Ações de Otimização no Pipeline de Recuperação (Retrieval)

### 2.1 Alinhamento dos Mecanismos de Re-ranking
* Portar integralmente as regras de bonificação de códigos de disciplina, bônus de matriz curricular e penalizações cruzadas para a função `searchDocuments` em `packages/mcp-server/src/index.ts`.
* Homogeneizar o parâmetro $\alpha$ do RRF ou calibrá-lo empiricamente entre a busca vetorial e a busca léxica.

### 2.2 Busca Híbrida Assimétrica (Vetor Contextual vs. FTS Léxico)
* Reformular a ferramenta de busca para aceitar ou derivar dois formatos de entrada:
  1. **Consulta Semântica Completa:** Frase estruturada/expandida voltada ao modelo denso `bge-m3`.
  2. **Termos-Chave e Radicais:** Palavras filtradas e tratadas por operadores booleanos (`&`, `|`) para o `to_tsquery('portuguese_unaccent')`.

### 2.3 Reranker de Segundo Estágio (Cross-Encoder)
* O RRF combina posições ordinais (*ranks*), sem ponderar a relevância intrínseca entre o par pergunta-trecho.
* A inclusão de um *cross-encoder* local leve (ex: `bge-reranker-base` ou `bge-reranker-v2-m3`) sobre os 10 melhores candidatos do RRF, selecionando os 5 mais relevantes para o agente, melhora a precisão de topo (*Precision@1* e *Precision@3*).

---

## 3. Ações de Otimização na Orquestração Agêntica

### 3.1 Correção do Esquema e Forçamento de Ferramenta
* Alinhar o enum de intenção entre o System Prompt e o esquema Zod (`ESTAGIO_TCC`).
* Configurar o parâmetro de geração para forçar a invocação da ferramenta de busca (`tool_choice: "required"` ou equivalente) em perguntas acadêmicas não identificadas pelo *fast-path* de saudações, eliminando omissões de consulta.

### 3.2 Busca Corretiva Iterativa (*Multi-turn ReAct / Corrective RAG*)
* Permitir que o agente execute até 2 passos de busca caso a primeira consulta retorne vazia ou com scores abaixo do limiar de corte (`MIN_RRF_SCORE`).
* Se a primeira busca falhar, o agente recebe o aviso de ausência de dados e pode tentar termos alternativos ou mais gerais antes de emitir a resposta de recusa.

### 3.3 Injeção de ICL Dinâmico no Prompt do Agente
* Recuperar interações anteriores avaliadas positivamente (`getPositiveExamples`) e injetá-las no histórico da conversa antes da síntese final (Passo 3 de geração).

---

## 4. Parâmetros de Inferência e Modelo de Linguagem

| Parâmetro / Componente | Configuração Atual | Recomendação para Alta Precisão | Justificativa |
| :--- | :--- | :--- | :--- |
| **Temperatura (Síntese)** | `0.2` | `0.0` | Minimiza qualquer desvio estocástico ou alucinação factual em dados normativos. |
| **Top P** | Padrão | `0.85` | Restringe a amostragem aos tokens de maior probabilidade factual. |
| **Repetition Penalty** | Padrão | `1.1` | Evita redundâncias ou loops em listas de disciplinas. |
| **Porte do Modelo LLM** | `qwen3.5:4b` | `qwen2.5:7b-instruct` ou `llama-3.1:8b-instruct` | Modelos de 7B a 8B parâmetros possuem maturidade superior em *Function Calling*, menor taxa de omissão de ferramentas e maior obediência a esquemas JSON. |

---

## 5. Plano de Avaliação e Validação Científica (Métricas Formais)

Para mensurar o ganho de precisão de forma padronizada para o TCC:

1. **Construção de um Golden Dataset Normativo:**
   * Conjunto fixo de 50 a 100 perguntas institucionais cobrindo PPC, ementas, trancamento, TCC e estágios, associadas às respostas de referência (*ground truth*) e aos IDs de trechos oficiais correspondentes.
2. **Avaliação Automatizada via Framework RAGAS:**
   * **Context Precision:** Mede se os fragmentos relevantes retornados pelo servidor MCP estão concentrados nas primeiras posições.
   * **Context Recall:** Avalia se todas as informações necessárias para responder à dúvida foram efetivamente recuperadas.
   * **Faithfulness (Fidelidade):** Quantifica se a resposta gerada baseia-se exclusivamente nas evidências documentais extraídas.
   * **Answer Relevance:** Avalia a aderência direta da resposta gerada em relação à pergunta formulada pelo discente.

---

## 6. Matriz de Priorização das Melhorias

| Ação | Impacto na Precisão | Esforço Técnico | Prioridade |
| :--- | :---: | :---: | :---: |
| Correção do enum `TCC` $\rightarrow$ `ESTAGIO_TCC` no agente | Alto | Mínimo | Imediata |
| Portar boosts de código e matriz para o servidor MCP | Alto | Baixo | Imediata |
| Forçamento determinístico de chamada da ferramenta | Alto | Baixo | Imediata |
| Injeção de ICL dinâmico (exemplos 👍) no agente | Médio | Baixo | Alta |
| Ajuste de temperatura para `0.0` na síntese factual | Médio | Mínimo | Alta |
| Busca híbrida assimétrica (vetor contextual + FTS limpo) | Alto | Médio | Alta |
| Busca corretiva em 2 iterações (Corrective RAG) | Alto | Médio | Média |
| Avaliação formal com Golden Dataset e RAGAS | Alto | Médio | Recomendada para TCC |
| Implementação de Cross-Encoder Reranker local | Muito Alto | Alto | Futura |
| Migração para modelo de 7B/8B parâmetros | Muito Alto | Médio (requer VRAM) | Futura |
