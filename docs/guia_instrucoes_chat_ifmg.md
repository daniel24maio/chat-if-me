# Guia de Instruções e Roteiro de Teste — Chat Assistente Virtual IFMG
**Projeto de Conclusão de Curso (TCC) — IFMG Campus Ouro Branco**  
**Autores:** Daniel G. D. Silva e Ederson N. F. G. Júnior  
**Orientador:** Prof. Dr. Saul Silva Delabrida  
**Aplicação Web:** [https://chat.danielgsilva.com.br/](https://chat.danielgsilva.com.br/)  
**Documento em PDF pronto para distribuição:** [`docs/Guia_Instrucoes_Chat_IFMG.pdf`](Guia_Instrucoes_Chat_IFMG.pdf)

---

## 1. O que é o Chat Assistente Virtual IFMG?

O **Chat Assistente Virtual IFMG** é uma ferramenta de Inteligência Artificial desenvolvida no Campus Ouro Branco para facilitar o acesso rápido às normas e regulamentos institucionais. Em vez de ler dezenas de páginas de arquivos PDF extensos, alunos e professores podem enviar perguntas em linguagem natural e receber respostas fundamentadas nos seguintes documentos oficiais:

- **Regulamento Didático do Ensino Superior do IFMG:** frequência mínima, cálculo de notas e exame final, procedimentos de trancamento de matrícula, aproveitamento de estudos, regime especial e prazos acadêmicos.
- **Projetos Pedagógicos de Curso (PPCs):** matriz curricular, pré-requisitos de disciplinas, ementas, cargas horárias e regras de optativas para os quatro cursos de graduação do campus:
  - *Bacharelado em Sistemas de Informação (BSI)*
  - *Bacharelado em Administração*
  - *Engenharia Metalúrgica*
  - *Licenciatura em Pedagogia*
- **Regulamentos Gerais de TCC e Estágio Supervisionado:** requisitos de orientação, composição de banca, prazos e horas obrigatórias.

> **Privacidade e Infraestrutura Local:** O assistente utiliza um modelo de linguagem aberto e compacto de 4 bilhões de parâmetros hospedado integralmente em servidor próprio da instituição, sem custos por mensagem e sem compartilhamento de dados com provedores externos de nuvem.

---

## 2. Como Utilizar e Alternar entre os Modos (RAG vs Agente MCP)

O sistema possui **duas arquiteturas de inteligência artificial** implementadas para confrontação científica. Você pode alternar entre elas a qualquer momento clicando no botão no **canto superior direito do cabeçalho**:

### 📚 Modo RAG Clássico (Botão Verde)
- **Como funciona:** Realiza busca vetorial direta nos regulamentos e gera a resposta de maneira linear e contínua.
- **Vantagem:** Respostas mais rápidas e com menor tempo de espera para o início da leitura.
- **Identificação:** Mensagens sinalizadas com a etiqueta `⚡ Modo: RAG Clássico`.

### 🤖 Modo Agente MCP (Botão Roxo)
- **Como funciona:** Arquitetura agêntica governada pelo *Model Context Protocol* (MCP). O modelo analisa a pergunta, aciona ferramentas de busca normativa e sintetiza as evidências encontradas.
- **Vantagem:** Cita explicitamente os documentos e normas consultadas no rodapé da mensagem (`📚 Fontes: [...]`).
- **Identificação:** Mensagens sinalizadas com a etiqueta `🤖 Modo: Agente MCP`.

> **Dica para o Teste:** Faça a **mesma pergunta nos dois modos** para poder comparar a rapidez, a profundidade do texto e a transparência das fontes citadas.

---

## 3. Onde Clicar para Demonstrar se Concorda ou Discorda da Resposta?

Logo abaixo de cada resposta gerada pelo assistente, há dois botões de avaliação instantânea:

- **👍 Útil / Concordo:** Clique quando a resposta for clara, correta e tiver esclarecido adequadamente a sua dúvida de acordo com as normas.
- **👎 Não Útil / Discordo:** Clique se a resposta contiver erros, regras contrárias aos regulamentos, omissões importantes ou se estiver vaga e confusa.

*Seu voto é registrado de forma anônima e instantânea no banco de dados do projeto, permitindo calcular a taxa de aprovação quantitativa na defesa do TCC.*

---

## 4. Roteiro Prático de Teste (Duração: 5 a 7 minutos)

1. **Passo 1 (Escolha 2 Dúvidas):** Escolha 2 perguntas da tabela da Seção 5 (ou utilize dúvidas reais suas sobre disciplinas, estágio, TCC ou normas).
2. **Passo 2 (Envie no 1º Modo):** Envie as 2 perguntas no modo ativo (ex.: RAG). Leia as respostas e clique em 👍 ou 👎 em cada uma.
3. **Passo 3 (Troque o Modo):** Recarregue a página, alterne o botão no topo para o outro modo (ex.: Agente) e repita **as mesmas 2 perguntas**, votando novamente 👍 ou 👎.
4. **Passo 4 (Preencha o Formulário):** Acesse o questionário de avaliação online para registrar sua percepção geral sobre o sistema.

---

## 5. Sugestões de Perguntas para Testar (6 Exemplos por Grupo)

| Público / Curso | 6 Sugestões de Perguntas Acadêmicas para Interação |
|---|---|
| **Normas Gerais**<br>*(Todos os cursos e docentes)* | 1. Qual a frequência mínima exigida para ser aprovado em uma disciplina?<br>2. Qual a nota mínima para aprovação e como funciona o exame final?<br>3. Como funciona o processo de trancamento total ou parcial de matrícula?<br>4. Posso aproveitar disciplinas cursadas em outra instituição? Como proceder?<br>5. Perdi uma avaliação por motivo justificado. Como peço segunda chamada?<br>6. Qual é o prazo máximo de integralização curricular para concluir o curso? |
| **Sistemas de Informação**<br>*(Discentes BSI)* | 1. Quais são os pré-requisitos para cursar Banco de Dados I?<br>2. Quais disciplinas compõem a grade curricular do 4º período?<br>3. Quantas horas de Atividades Complementares (ACG) são obrigatórias?<br>4. O estágio é obrigatório para os alunos de BSI? Qual a carga horária mínima?<br>5. Qual é o conteúdo programático da disciplina de Inteligência Artificial?<br>6. Quantas horas de disciplinas optativas preciso cumprir para me formar? |
| **Administração**<br>*(Discentes ADM)* | 1. Quais disciplinas fazem parte da grade do 1º período de Administração?<br>2. Qual é a carga horária mínima e as regras do estágio supervisionado?<br>3. Quantas horas de atividades complementares preciso comprovar?<br>4. Quais são os pré-requisitos obrigatórios para ingressar no TCC?<br>5. O que é estudado nas disciplinas introdutórias de contabilidade e gestão?<br>6. Qual a carga horária total da matriz curricular e o tempo sugerido de curso? |
| **Engenharia Metalúrgica**<br>*(Discentes Metalurgia)* | 1. O estágio é obrigatório no curso? Qual a carga horária mínima exigida?<br>2. Quais são os pré-requisitos necessários para matricular no TCC?<br>3. Quais disciplinas compõem a matriz curricular do 1º período?<br>4. O que é abordado na ementa da disciplina de Termodinâmica Metalúrgica?<br>5. Quantas horas de atividades complementares devem ser integralizadas?<br>6. Qual a carga horária total da formação em Engenharia Metalúrgica? |
| **Licenciatura em Pedagogia**<br>*(Discentes Pedagogia)* | 1. Como é organizado o estágio supervisionado e em quais etapas ele ocorre?<br>2. Quantas horas de atividades complementares de graduação são requeridas?<br>3. Quais matérias compõem a grade curricular inicial do 1º período?<br>4. Como funciona a Prática como Componente Curricular (PCC) no curso?<br>5. O que é ensinado na disciplina de Didática Geral?<br>6. Quais são as normas para elaboração e defesa do Trabalho de Conclusão de Curso? |
| **Docentes e Gestão**<br>*(Professores e Coordenadores)* | 1. Quais são as atribuições formais do professor orientador de TCC?<br>2. Como deve ser constituída a banca examinadora de defesa de TCC?<br>3. Qual o prazo regulamentar para o lançamento de notas e frequências no sistema?<br>4. Em quais hipóteses o discente possui amparo para regime especial ou 2ª chamada?<br>5. Qual o procedimento para um aluno protocolar pedido formal de revisão de nota?<br>6. Qual o limite máximo de carga horária na modalidade a distância em cursos presenciais? |

---

## 6. Formulário de Avaliação e Coleta de Feedback (Questionário Unificado)

Para confrontar rigorosamente as duas versões do assistente e embasar a pesquisa científica do TCC, foi adotado um **Questionário Unificado de Avaliação** (o mesmo questionário oficial de 11 perguntas atende discentes de todos os cursos e professores, com preenchimento em 2 a 3 minutos):

- **[Q1] Perfil do Respondente:** Identificação do curso (BSI, Administração, Eng. Metalúrgica ou Pedagogia) e período, ou opção "Docente / Servidor".
- **[Q2 e Q3] Desempenho e Precisão no Modo RAG:** Notas de 1 a 5 para velocidade e assertividade no modo linear.
- **[Q4 e Q5] Desempenho e Precisão no Modo Agente MCP:** Notas de 1 a 5 para velocidade e assertividade no modo agêntico (permitindo a comparação pareada direta com o RAG).
- **[Q6] Auditoria de Confiabilidade e Alucinações:** Avaliação de fidelidade factual (totalmente confiável, recusa correta, divergência leve ou alucinação).
- **[Q7] Percepção Comparativa e Coerência:** Indicação direta de qual modo foi mais coerente com os documentos oficiais, ou se prefere ambos disponíveis.
- **[Q8] Usabilidade da Interface Web (TAM):** Facilidade de uso percebida (botões de modo, feedback e leitura em celular/computador).
- **[Q9] Utilidade Institucional (TAM):** Medida em que o chat reduz idas presenciais e evita leitura manual de PDFs extensos.
- **[Q10] Novas Demandas para Ferramentas MCP (Futuro):** Mapeamento de novos serviços desejados (horários de ônibus, cardápio do refeitório, localização de blocos/salas, diretório de e-mails, avisos e editais).
- **[Q11] Auditoria de Falhas e Sugestões Livres:** Campo aberto para registrar perguntas em que o assistente falhou (para refinamento do *Golden Dataset*) e comentários gerais.

**Link para o Formulário de Avaliação:**  
[👉 Clique aqui para responder ao Formulário de Avaliação](https://forms.gle/exemploQuestionarioTCC) *(ou acesse pelo link compartilhado pelo orientador/pesquisadores)*
