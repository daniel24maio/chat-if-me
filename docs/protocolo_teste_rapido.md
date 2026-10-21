# Protocolo de Teste Rápido — RAG Clássico × Agente MCP
**Chat Assistente Virtual IFMG — Campus Ouro Branco**
**Duração por participante:** 7 a 8 minutos
**Endereço:** [https://chat.danielgsilva.com.br/](https://chat.danielgsilva.com.br/)

> Este protocolo substitui, para a coleta com o público geral, o questionário de 11 perguntas de [roteiro_e_tutorial_teste_chat.md](roteiro_e_tutorial_teste_chat.md). O roteiro anterior continua válido como tutorial de uso.

---

## 1. Objetivo e desenho do experimento

O teste compara as duas versões do assistente usando **as mesmas duas perguntas** nos dois modos, feitas pelo mesmo participante. Assim, cada pessoa gera duas avaliações pareadas (RAG × Agente), o que permite comparar as versões mesmo com uma amostra pequena.

| Item | Definição |
|---|---|
| Tipo de comparação | Pareada (cada participante avalia os dois modos) |
| Tarefa | 2 perguntas, enviadas no modo RAG e no modo Agente |
| Organização | Em blocos: as duas perguntas no 1º modo, depois as duas no 2º modo |
| Ordem dos modos | Alternada entre participantes (ver Seção 3) |
| Formulário | 7 itens para alunos, 8 para professores |
| Tempo estimado | ~2 min (RAG) + ~3 min (Agente) + ~2 min (formulário) |

### Por que duas perguntas e em blocos?
- **Duas perguntas** dobram o número de pares avaliados (40 pares de alunos e 10 de professores) e reduzem o peso de uma pergunta isolada que o sistema acerte ou erre por acaso.
- **Em blocos** (tudo em um modo, depois tudo no outro), o participante troca de modo uma única vez e avalia cada versão de uma vez, o que deixa o formulário mais simples.
- Os tempos médios medidos no TCC foram de **57,3 s no RAG** e **84,6 s no Agente**; por isso, a sessão passa dos 5 minutos e fica entre 7 e 8 minutos.

---

## 2. Amostra (cotas)

| Público | Grupo | Meta | Código |
|---|---|---|---|
| Alunos | Bacharelado em Sistemas de Informação | 5 | A-BSI-01 a 05 |
| Alunos | Bacharelado em Administração | 5 | A-ADM-01 a 05 |
| Alunos | Engenharia Metalúrgica | 5 | A-MET-01 a 05 |
| Alunos | Licenciatura em Pedagogia | 5 | A-PED-01 a 05 |
| Professores | Áreas diversas (no máximo 2 da Computação) | 5 | P-01 a P-05 |
| **Total** | | **25** | |

- **Alunos:** preferir períodos variados dentro de cada curso (ao menos 1 iniciante e 1 concluinte).
- **Professores:** buscar professores que orientam TCC/estágio ou atuam em colegiado, pois conhecem as normas e podem verificar se a resposta está correta.
- Use o **código do participante** no formulário (não colete nome nem e-mail), o que facilita a aprovação ética e a tabulação.

> [!IMPORTANT]
> **Pré-requisito:** após adicionar os PPCs de Administração, Engenharia Metalúrgica e Pedagogia, fazer as perguntas da Seção 5 uma vez em cada modo para confirmar que os documentos estão sendo recuperados. Pergunta que o sistema não consegue responder por falta do documento deve ser trocada antes da coleta.

> [!WARNING]
> O servidor roda um modelo local em GPU. Vários testes simultâneos aumentam a latência e distorcem a comparação de tempo. Aplicar **um participante por vez** (ou no máximo 2) e anotar o horário de cada sessão para cruzar com os logs.

---

## 3. Contrabalanceamento da ordem

Quem usa um modo primeiro tende a avaliar o segundo comparando com o primeiro. Para neutralizar esse efeito, alternar a ordem:

| Público | Códigos 01, 03, 05 | Códigos 02, 04 |
|---|---|---|
| Alunos | **RAG → Agente** | **Agente → RAG** |
| Professores | **Agente → RAG** | **RAG → Agente** |

Com 5 participantes por grupo, a divisão fica 3/2. A regra invertida para os professores equilibra o total geral em 13 começando pelo RAG e 12 pelo Agente.

---

## 4. Roteiro do aplicador (passo a passo)

### Antes da sessão (preparação)
1. Abrir o chat em uma aba limpa (recarregar a página para zerar o histórico).
2. Abrir o formulário em outra aba.
3. Separar o código do participante e a ordem dos modos (Seção 3).
4. Deixar visível a lista de perguntas do público do participante (Seção 5).

### Fala de abertura (~20 s)
> "Este é um assistente que responde dúvidas sobre as normas e os documentos do curso. Ele tem duas versões, e quero saber qual funciona melhor. Você vai escolher **duas perguntas**, fazer as duas em uma versão, depois as mesmas duas na outra, e no final responder um formulário curto. Leva uns 7 minutos. Não existe resposta certa: estou avaliando o sistema, não você."

### Escolha das perguntas (~30 s)
- **Alunos:** 1 pergunta de **normas gerais** (Bloco G) + 1 pergunta **do próprio curso** (Bloco do curso).
- **Professores:** 2 perguntas do Bloco P, ou 1 do Bloco P + 1 pergunta própria cuja resposta conheçam.

Anotar os códigos das perguntas escolhidas (ex.: G3 e MET-2).

### Execução (~5 min)
| Passo | Ação do participante | Ação do aplicador |
|---|---|---|
| 1 | Confere que está no **1º modo** da sua ordem | Confere o botão do topo (📚 verde ou 🤖 roxo) e anota o horário |
| 2 | Envia a **pergunta 1**, lê a resposta e clica 👍 ou 👎 | — |
| 3 | Envia a **pergunta 2**, lê a resposta e clica 👍 ou 👎 | — |
| 4 | Recarrega a página e troca o modo pelo botão do topo | Confere o novo modo e anota o horário |
| 5 | Envia **a mesma pergunta 1**, com o mesmo texto, e vota 👍/👎 | Pode sugerir copiar e colar |
| 6 | Envia **a mesma pergunta 2**, com o mesmo texto, e vota 👍/👎 | — |

> Recarregar a página no passo 4 evita que o histórico da conversa no primeiro modo influencie a resposta do segundo.

**Regras para o aplicador:**
- Não comentar qual modo é "melhor" nem explicar a arquitetura antes do formulário.
- Não ajudar a reformular a pergunta. Se o sistema errar, isso é dado.
- Se uma resposta passar de 3 minutos, registrar "timeout" no formulário e seguir.

### Encerramento (~2 min)
Participante preenche o formulário (Seção 6 ou 7). Agradecer.

---

## 5. Perguntas de exemplo (6 por público)

Perguntas fechadas e com resposta verificável facilitam a comparação. A coluna "Gabarito" deve ser preenchida pela equipe **antes** da coleta, com o documento e o artigo ou a página, para permitir a conferência da correção.

### Bloco G — Normas gerais (alunos de todos os cursos)
| Cód. | Pergunta | Gabarito (documento / artigo) |
|---|---|---|
| G1 | Qual a frequência mínima para ser aprovado em uma disciplina? | |
| G2 | Qual a nota mínima para aprovação e como funciona o exame final? | |
| G3 | Como faço para trancar a matrícula e até quando posso fazer isso? | |
| G4 | Posso aproveitar uma disciplina que cursei em outra instituição? Como peço? | |
| G5 | Perdi uma prova por motivo de saúde. Tenho direito a segunda chamada? | |
| G6 | Qual o prazo máximo que tenho para concluir o curso? | |

### Bloco BSI — Sistemas de Informação
| Cód. | Pergunta | Gabarito |
|---|---|---|
| BSI-1 | Quais são os pré-requisitos de Banco de Dados I? | |
| BSI-2 | Quais disciplinas fazem parte do 4º período? | |
| BSI-3 | Quantas horas de atividades complementares preciso cumprir? | |
| BSI-4 | O estágio é obrigatório no curso? Qual a carga horária? | |
| BSI-5 | O que é estudado na disciplina de Inteligência Artificial? | |
| BSI-6 | Quantas horas de disciplinas optativas preciso cursar? | |

### Bloco ADM — Administração
| Cód. | Pergunta | Gabarito |
|---|---|---|
| ADM-1 | Quais disciplinas fazem parte do 1º período? | |
| ADM-2 | Qual a carga horária do estágio supervisionado? | |
| ADM-3 | Quantas horas de atividades complementares preciso cumprir? | |
| ADM-4 | Quais são os pré-requisitos para cursar o TCC? | |
| ADM-5 | O que é estudado nas disciplinas de contabilidade do curso? | |
| ADM-6 | Qual a carga horária total do curso e em quantos semestres ele é feito? | |

### Bloco MET — Engenharia Metalúrgica
| Cód. | Pergunta | Gabarito |
|---|---|---|
| MET-1 | O estágio é obrigatório? Qual a carga horária mínima? | |
| MET-2 | Quais são os pré-requisitos para cursar o TCC? | |
| MET-3 | Quais disciplinas fazem parte do 1º período? | |
| MET-4 | O que é estudado na disciplina de Termodinâmica? | |
| MET-5 | Quantas horas de atividades complementares preciso cumprir? | |
| MET-6 | Qual a carga horária total do curso e em quantos semestres ele é feito? | |

### Bloco PED — Pedagogia
| Cód. | Pergunta | Gabarito |
|---|---|---|
| PED-1 | Como é organizado o estágio supervisionado e em quais períodos ele acontece? | |
| PED-2 | Quantas horas de atividades complementares preciso cumprir? | |
| PED-3 | Quais disciplinas fazem parte do 1º período? | |
| PED-4 | Como funciona a prática como componente curricular no curso? | |
| PED-5 | O que é estudado na disciplina de Didática? | |
| PED-6 | Quais são as regras para o Trabalho de Conclusão de Curso? | |

### Bloco P — Professores
| Cód. | Pergunta | Gabarito |
|---|---|---|
| P1 | Quais são as atribuições do professor orientador de TCC? | |
| P2 | Como é composta a banca de avaliação do TCC? | |
| P3 | Qual o prazo para lançamento de notas e frequência? | |
| P4 | Em que situações o aluno tem direito a segunda chamada ou regime especial? | |
| P5 | Como o aluno pode pedir revisão de nota de uma avaliação? | |
| P6 | Qual o percentual máximo de carga horária a distância em um curso presencial? | |

> [!NOTE]
> Os nomes de disciplinas (ex.: Termodinâmica, Didática, contabilidade) devem ser conferidos nos PPCs após a indexação e ajustados para o nome exato da matriz curricular.

---

## 6. Formulário — Alunos (7 itens, ~2 min)

**A1. Código do participante:** `[ texto curto ]` (ex.: A-MET-03)

**A2. Período atual:** ( ) 1º–3º  ( ) 4º–6º  ( ) 7º ou mais

**A3. Quais perguntas você fez?** `[ caixas de seleção: G1…G6, BSI-1…PED-6, Outra ]`

**A4. Pensando nas duas respostas de cada modo, avalie** (1 Discordo totalmente … 5 Concordo totalmente):

| Afirmação | 📚 RAG (1–5) | 🤖 Agente (1–5) |
|---|---|---|
| a) As respostas responderam às minhas perguntas. | | |
| b) As respostas foram claras e fáceis de entender. | | |
| c) O tempo de espera foi aceitável. | | |
| d) Eu confiaria nessas respostas sem consultar o documento. | | |

**A5. Se tivesse que usar apenas um, qual modo você preferiria?**
( ) 📚 RAG  ( ) 🤖 Agente  ( ) Tanto faz

**A6. Você usaria este assistente para tirar dúvidas do seu curso?**
( ) Sim  ( ) Talvez  ( ) Não

**A7. (Opcional) Algum comentário ou erro que você percebeu?** `[ texto curto ]`

---

## 7. Formulário — Professores (8 itens, ~2 min)

**P1. Código do participante:** `[ texto curto ]` (ex.: P-04)

**P2. Área de atuação:** ( ) Computação  ( ) Gestão/Administração  ( ) Engenharias/Metalurgia  ( ) Educação/Licenciaturas  ( ) Ciências básicas  ( ) Outra

**P3. Quais perguntas você fez?** `[ caixas de seleção: P1…P6, G1…G6, Outra ]`

**P4. As respostas estão de acordo com a norma?** (item de **correção factual**, o mais importante deste público)

| | Correta | Parcialmente correta | Incorreta | Não sei avaliar |
|---|---|---|---|---|
| Pergunta 1 — 📚 RAG | | | | |
| Pergunta 1 — 🤖 Agente | | | | |
| Pergunta 2 — 📚 RAG | | | | |
| Pergunta 2 — 🤖 Agente | | | | |

**P5. Pensando nas duas respostas de cada modo, avalie** (1 Discordo totalmente … 5 Concordo totalmente):

| Afirmação | 📚 RAG (1–5) | 🤖 Agente (1–5) |
|---|---|---|
| a) As respostas foram claras e completas. | | |
| b) As respostas indicam de onde veio a informação (fonte). | | |
| c) O tempo de espera foi aceitável. | | |

**P6. Qual modo você recomendaria para atendimento aos alunos?**
( ) 📚 RAG  ( ) 🤖 Agente  ( ) Ambos disponíveis  ( ) Nenhum

**P7. O assistente pode reduzir dúvidas repetitivas que chegam a você ou à coordenação?**
( ) Sim  ( ) Parcialmente  ( ) Não

**P8. (Opcional) Se fez uma pergunta própria ou notou erro, descreva:** `[ texto curto ]`

---

## 8. Como os itens confrontam as versões

| Construto | Alunos | Professores | Comparação |
|---|---|---|---|
| Assertividade / correção | A4a + conferência com gabarito | P4 (por pergunta) | RAG × Agente, pareado |
| Clareza | A4b | P5a | RAG × Agente, pareado |
| Latência percebida | A4c | P5c | Pareado + cruzar com tempo real dos logs |
| Confiança / rastreabilidade | A4d | P5b | Pareado (testa a vantagem esperada do Agente) |
| Preferência geral | A5 | P6 | Contagem por modo |
| Utilidade (TAM) | A6 | P7 | Por público e por curso |

---

## 9. Análise dos resultados (para a Seção de Experimentos)

1. **Comparação pareada:** para cada item de grade, calcular a diferença Agente − RAG por participante. Reportar mediana e média das diferenças e aplicar o **teste de Wilcoxon pareado** no total de alunos (n = 20) e no total geral (n = 25).
2. **Correção por resposta:** com 2 perguntas por participante, há 50 pares de respostas (100 respostas). Conferir cada resposta com o gabarito da Seção 5 a partir dos logs e calcular a taxa de acerto por modo. Para professores, usar também o item P4.
3. **Por curso (n = 5):** apenas estatística descritiva (mediana, distribuição). Não aplicar testes estatísticos com 5 respostas; declarar isso como limitação.
4. **Normas gerais × PPC:** comparar o desempenho dos modos nas perguntas do Bloco G e nas perguntas do curso, já que cada aluno faz uma de cada.
5. **Latência:** comparar A4c/P5c com o tempo registrado no servidor para a mesma sessão (horários anotados nos passos 1 e 4).
6. **Cruzamento com 👍/👎:** relacionar os votos da tabela `chat_feedbacks` com o modo e o código de pergunta.
7. **Efeito de ordem:** comparar as notas de quem começou pelo RAG com quem começou pelo Agente. Se houver diferença grande, registrar no texto.

### Limitações a declarar no TCC
- Amostra por conveniência e pequena (5 por grupo).
- O participante sabe qual modo está usando (o rótulo aparece na interface), o que pode influenciar a avaliação.
- Cada participante avalia duas perguntas de uma lista pré-definida; o resultado representa esses tipos de pergunta, não todo o domínio.

---

## 10. Checklist de controle da coleta

| Código | Data/hora | Ordem | Pergunta 1 | Pergunta 2 | Formulário enviado | Obs. |
|---|---|---|---|---|---|---|
| A-BSI-01 | | RAG → Agente | | | ☐ | |
| A-BSI-02 | | Agente → RAG | | | ☐ | |
| … | | | | | | |
| P-05 | | Agente → RAG | | | ☐ | |
