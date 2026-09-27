# Regras de Redação Acadêmica do Projeto (TCC)

As seguintes regras foram definidas pelo orientador e devem ser rigorosamente consultadas e aplicadas em todas as edições, revisões ou ampliações do texto do TCC (`tcc/main.tex`):

1. **Estrutura Lógica de Abertura da Introdução**:
   - O primeiro bloco da Introdução deve fundir o contexto inicial em um único parágrafo fluido seguindo a sequência:
     `CONTEXTO -> Normas necessárias -> como funciona -> gap da literatura`.
   - Evitar fragmentar o contexto inicial em parágrafos de 2 ou 3 linhas e evitar aberturas precipitadas com "Nesse contexto".

2. **Eliminar clichês e "marcas de IA"**:
   - Evitar aberturas genéricas como "No âmbito dos...", "No cenário atual...". Preferir construções diretas (ex: "Em assistentes virtuais voltados a ambientes universitários...").
   - Evitar adjetivos hiperbólicos de valor (ex: "indispensável", "crucial", "fundamental", "drástico"). Apresentar fatos de maneira sóbria e neutra.
   - **Vocabulário Direto e Acessível:** Preferir termos claros do cotidiano técnico-acadêmico em vez de vocabulário excessivamente rebuscado, arcaico ou pedante (ex: preferir "responder a dúvidas" a "sanar dúvidas de discentes", "diferem" a "diferem de forma drástica", "mudança" a "transição de paradigma"). Manter o rigor acadêmico sem artificialidade.

3. **Citações e Referência a Trabalhos**:
   - **Regra de Estilo de Citação:** Não prefixar a citação com o sobrenome do autor (evitar "Monteiro \cite{monteiro2021helena}", "Barbosa \cite{barbosa2023chatbot}"). Utilizar citações diretas no corpo da frase (ex: "Em \cite{monteiro2021helena}, foi desenvolvido...", "O trabalho \cite{barbosa2023chatbot} propõe...", "Conforme demonstrado em \cite{modran2025leveraging}...").
   - Evitar o vício de linguagem "o referido autor" / "o citado autor". Referenciar o próprio trabalho ou a proposta (ex: "em \cite{oliveira2025arquitetura}").
   - Manter autores institucionais com siglas limpas em `referencias.bib` (ex: `author = {{IFMG Campus Ouro Branco}}`).
   - Não utilizar marcadores de rascunho de revisão no texto final (ex: `\ederson{...}`, `\daniel{...}`).

4. **Definição e Uso de Siglas e Acrônimos**:
   - Definir toda sigla/acrônimo formalmente em sua **primeira aparição** no texto (ex: `Reconhecimento Óptico de Caracteres (\textit{Optical Character Recognition} -- OCR)`).
   - Nas ocorrências posteriores, utilizar apenas a sigla (ex: `OCR`), removendo definições repetidas ou tardias.

5. **Formatação de Tabelas e Ilustrações**:
   - **Estrutura Topo / Rodapé:** Inserir sempre o `\caption{...}` e `\label{...}` no **topo** (antes da tabela/imagem), seguido de espaçamento de respiro (`\vspace{0.3cm}`). A fonte deve ficar **obrigatoriamente no rodapé** (`\vspace{0.15cm}` seguido de `{\small Fonte: Elaborado pelo Próprio Autor.}`). Nunca colocar a fonte no topo ou entre o caption e a tabela.
   - **Contextualização Textual:** Toda tabela deve ser introduzida e discutida criticamente no parágrafo adjacente (evitar tabelas soltas com apenas "A Tabela X sintetiza...").
   - **Largura e Margens:** Utilizar `tabularx` com largura `\textwidth` e colunas `>{\RaggedRight}X` em tabelas com texto descritivo para evitar estouro de margem (`Overfull \hbox`).
   - **Controle de Vazamento:** Utilizar `\FloatBarrier` (pacote `placeins`) antes de novas subseções para impedir que elementos flutuantes cortem tópicos ou listas posteriores.
