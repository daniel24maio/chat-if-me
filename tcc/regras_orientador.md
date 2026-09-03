# Regras e Dicas do Orientador para Redação do TCC 📝🎓

Este documento consolida as diretrizes de estilo, tom e norma culta acadêmica definidas pelo orientador (Prof. Ederson) para a escrita e revisão contínua do texto do TCC (`main.tex`).

---

## 📌 Diretrizes Principais de Estilo e Estrutura

### 1. Estrutura Lógica de Abertura da Introdução
* **Sequência Sequencial Obrigatória no 1º Bloco da Introdução:**
  1. **CONTEXTO**: Apresentar o cenário geral da formação em ensino superior.
  2. **NORMAS NECESSÁRIAS**: Apresentar os regulamentos formais (PPCs, disciplinas, estágio, TCC).
  3. **COMO FUNCIONA**: Explicar a busca atual dos alunos (portais, secretarias, coordenações).
  4. **GAP DA LITERATURA / PROBLEMA**: Apontar o gargalo (informações dispersas em PDFs, linguagem burocrática e sobrecarga administrativa).
* **Unificação de parágrafos:** Evitar fragmentar o contexto inicial em parágrafos curtinhos de 2 a 3 linhas. Agrupar a cadeia lógica em um bloco inicial coeso.

---

### 2. Sobriedade Acadêmica e Eliminação de Vícios de Linguagem de IA
* **Evitar expressões clichês / "marcas de ChatGPT":**
  * ❌ *Não usar:* "No âmbito de", "No cenário atual", "No contexto de", "Neste prisma", "Nesse contexto" (em abertura de 2ª frase curta).
  * ✅ *Usar:* Construções diretas e objetivas (ex: "Em assistentes virtuais universitários...", "Na literatura sobre...").
* **Eliminar adjetivações hiperbólicas ou de valor:**
  * ❌ *Não usar:* "indispensável", "crucial", "fundamental", "notável", "drástica", "drasticamente".
  * ✅ *Usar:* Apresentação neutra e objetiva dos conceitos (ex: "Esta seção apresenta o embasamento teórico para...", em vez de "embasamento teórico indispensável").

---

### 3. Normas de Citação e Referência a Trabalhos Relacionados
* **Especificidade nas citações (Evitar viciosamente "o referido autor"):**
  * ❌ *Evitar:* Vários parágrafos consecutivos usando "o referido autor", "o citado autor".
  * ✅ *Usar:* Nome explícito do autor com citação direta (ex: "Modran \cite{modran2025leveraging} projeta...", "No trabalho de Barbosa \cite{barbosa2023chatbot}").
* **Formatação de Chave de Autor em Instituições (`referencias.bib`):**
  * ❌ *Não usar:* Nomes institucionais por extenso no campo `author` que geram citações inline gigantescas no estilo SBC.
  * ✅ *Usar:* Siglas limpas (ex: `author = {{IFMG Campus Ouro Branco}}` $\rightarrow$ `(IFMG Campus Ouro Branco, 2022)`).
* **Limpeza de marcações de edição:**
  * ❌ *Não manter no texto final:* Marcadores de rascunho de revisão como `\sout{por Modran}`.
  * ✅ *Usar:* Ajustar a preposição e regência diretamente no texto (ex: `ilustrada em \cite{modran2025leveraging}`).

---

### 4. Definição e Uso de Siglas e Acrônimos
* **Definição Obrigatória na Primeira Aparição:**
  * Toda sigla ou acrônimo (ex: OCR, RAG, MCP, LLM, PPC, SSE) deve ser expandido e formalmente definido em sua **primeira aparição** no texto (em português e, quando for termo técnico de origem estrangeira, acompanhado do original em inglês em itálico).
  * ❌ *Não usar:* Sigla solta ou sem definição na primeira ocorrência, deixando a definição para seções posteriores.
  * ✅ *Usar:* Definir logo na primeira vez (ex: `Reconhecimento Óptico de Caracteres (\textit{Optical Character Recognition} -- OCR)`) e, em todas as menções seguintes no restante do documento, utilizar estritamente a sigla (`OCR`), eliminando redundâncias.

---

## 📋 Lista de Verificação (Checklist de Revisão de Texto)

Ao redigir ou revisar qualquer seção em `main.tex`:
- [ ] O 1º bloco da Introdução segue a ordem: CONTEXTO $\rightarrow$ NORMAS $\rightarrow$ COMO FUNCIONA $\rightarrow$ GAP?
- [ ] O texto está livre de advérbios/adjetivos hiperbólicos ("indispensável", "crucial", "drástico")?
- [ ] As frases evitam aberturas clichês ("No âmbito dos...", "No contexto atual...")?
- [ ] As citações usam nomes limpos de autor/siglas e mencionam os autores de forma explícita?
- [ ] As siglas e acrônimos estão definidos formalmente em sua primeira ocorrência no texto e utilizados de forma reduzida nas ocorrências subsequentes?
- [ ] Foram removidos comandos de tachado/rascunho (`\sout{}`) das versões anteriores?
