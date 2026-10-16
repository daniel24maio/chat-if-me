# Cola para a Banca — Perguntas Prováveis e Respostas Curtas

> Formato: **Pergunta → Resposta curta → "Frase de bolso"** (a que dá para falar em voz alta em 10 segundos).
> Valores entre `parênteses` vêm do código/TCC do projeto.

---

## 1. RAG

**O que é?**
Antes de responder, o sistema **busca trechos nos documentos oficiais** e entrega esses trechos para o modelo. O modelo responde **usando só aquilo**.

**As 3 etapas:**
1. **Recuperação:** acha os trechos certos;
2. **Enriquecimento:** cola os trechos no *prompt*;
3. **Geração:** o LLM escreve a resposta com base nos trechos.

**Por que usar?**
O LLM puro "chuta" quando não sabe (alucinação). Com RAG, ele consulta antes de falar.

> 🗣️ **"O LLM não decora o PPC, ele consulta o PPC a cada pergunta."**

---

## 2. Knowledge (Base de Conhecimento)

**O que é?**
É o conjunto de documentos oficiais já processados e guardados no banco: PPC, ementário, regulamento de TCC etc. Fica no PostgreSQL, **fora** do modelo.

**Conhecimento paramétrico × não-paramétrico**
| Tipo | Onde fica | Como atualiza |
| :--- | :--- | :--- |
| **Paramétrico** | Dentro do LLM (pesos) | Retreinar (caro) |
| **Não-paramétrico** (nosso *knowledge*) | Banco de dados | **Subir o PDF novo** |

**O que é `search_ifmg_knowledge`?**
É o nome da **ferramenta MCP** que o agente chama para consultar essa base. É o único "caminho" do agente até os dados (somente leitura).

> 🗣️ **"Mudou a norma? Troca o PDF na base. Não precisa mexer na IA."**

---

## 3. Embedding

**O que é?**
Transformar um texto em uma **lista de números (vetor)** que representa o **significado**. Textos com sentido parecido ficam "perto" um do outro.

**Exemplo simples:**
"Como trancar o curso?" e "Quais as regras de trancamento de matrícula?" → vetores **próximos**, mesmo com palavras diferentes.

**Qual modelo?**
`BGE-M3`: 1024 dimensões, multilíngue (bom em português), aceita textos longos (até 8192 *tokens*), roda local.

**Por que local?**
Privacidade, custo zero por consulta e independência de internet/API externa.

> 🗣️ **"Embedding é o endereço do significado de um texto."**

---

## 4. Chunk

**O que é?**
Um **pedaço** do documento. Um PDF de 200 páginas não cabe no *prompt*, então é dividido em pedaços menores que são indexados.

**Como fazemos? (3 estratégias)**
| Estratégia | Para quê | Regra |
| :--- | :--- | :--- |
| `syllabus` | Ementas | Uma disciplina inteira num chunk (código, ementa, carga horária, bibliografia) |
| `normative` | Regulamentos | Não corta Artigo/Parágrafo/Inciso no meio |
| geral | Resto | Por parágrafo, máx. `2200` caracteres, com sobreposição de `300` |

**Prefixo contextual:** cada chunk recebe uma "etiqueta", ex.: `[Documento: PPC BSI | Contexto: Disciplina X]`, para o modelo saber de onde veio.

**Por que não cortar a cada N caracteres?**
Porque pode cortar o artigo no meio da frase e perder o sentido (ex.: o "exceto quando…" ficar em outro chunk).

**Chunk muito grande × muito pequeno:**
- Grande: traz ruído e estoura o contexto do modelo;
- Pequeno: perde o contexto da regra.

> 🗣️ **"Cortamos o documento respeitando a estrutura dele: uma disciplina ou um artigo por pedaço."**

---

## 5. Busca Híbrida

**O que é?**
Rodar **duas buscas ao mesmo tempo** e juntar os resultados:
- **Semântica (vetorial):** entende o *sentido* ("desistir do curso" ≈ "cancelamento de matrícula");
- **Léxica (texto exato, FTS):** acha *palavras exatas* (código `OBBGSIN.016`, siglas como ACG, TCC).

**Por que as duas?**
| Só semântica | Só texto exato |
| :--- | :--- |
| Erra código e sigla exata | Não entende sinônimos |

**Onde roda?**
Tudo no PostgreSQL: `pgvector` (vetorial, índice HNSW) + `tsvector` (texto, dicionário `portuguese_unaccent`).

> 🗣️ **"A semântica entende a ideia; o texto exato acha o código. Juntas cobrem as duas falhas."**

---

## 6. RRF (Reciprocal Rank Fusion)

**Problema que resolve:**
Cada busca devolve uma lista com **notas em escalas diferentes** (distância de cosseno × pontuação de texto). Não dá para somar as notas diretamente.

**Ideia do RRF:**
Ignora a nota e usa só a **posição no ranking**. Quem aparece bem posicionado nas duas listas sobe.

**Por que "reciprocal" (1/posição)?**
Quanto melhor a posição, maior a pontuação, e a diferença entre 1º e 2º pesa mais que entre 50º e 51º.

**E o `k = 60`?**
Constante de suavização (valor padrão do artigo original, Cormack et al., 2009). Evita que o 1º lugar domine demais.

**Extras do projeto (boost por intenção):**
- Pergunta sobre ementa e o código da disciplina bate → bônus `+0,30`;
- Pergunta sobre estrutura do curso → bônus `+0,12` para matrizes curriculares;
- Chunk com 👎 de alunos → pontuação reduzida.

> 🗣️ **"RRF junta duas listas olhando só a posição, não a nota."**

---

## 7. Fórmula e o papel do Alfa (α)

$$\mathrm{Score}(d) = \alpha \cdot \frac{1}{k + \mathrm{rank}_{\mathrm{sem}}(d)} + (1 - \alpha) \cdot \frac{1}{k + \mathrm{rank}_{\mathrm{lex}}(d)}$$

**Lendo em português:**
> Nota do chunk = (peso α × ponto da busca por **sentido**) + (peso 1−α × ponto da busca por **texto exato**)

| Símbolo | Significa |
| :--- | :--- |
| `d` | Um chunk candidato |
| `rank_sem` | Posição dele na busca semântica |
| `rank_lex` | Posição dele na busca por texto |
| `k` | Constante de suavização (`60`) |
| `α` | Quanto confiamos na semântica (0 a 1) |

**O que o α muda?**
| α | Efeito |
| :--- | :--- |
| Perto de **1** | Manda a **semântica** (bom para perguntas abertas/conceituais) |
| Perto de **0** | Manda o **texto exato** (bom para código, sigla, nome de documento) |
| **0,5** | Equilíbrio (usado no **RAG Clássico**) |
| **0,4** | Leve favorecimento do texto exato (usado no **MCP**) |

**Por que 0,4 no MCP?**
O agente costuma montar consultas curtas com termos específicos (código de disciplina, nome de norma). Dar um pouco mais de peso ao texto exato ajuda a acertar.

**Exemplo numérico (para mostrar na lousa):**
Dois chunks, `k = 60`:
- **A:** 1º na semântica, 20º no texto;
- **B:** 20º na semântica, 1º no texto.

| α | Nota A | Nota B | Quem ganha |
| :--- | :--- | :--- | :--- |
| 0,5 | 0,0145 | 0,0145 | Empate |
| 0,4 | 0,0141 | 0,0148 | **B** (texto exato pesa mais) |

**Valor máximo possível:** `1/61 ≈ 0,0164` (1º nas duas listas). Por isso a nota de corte do MCP é pequena (`≥ 0,002`).

**"Como escolheu o α?"**
Valores definidos por teste empírico durante o desenvolvimento. **Não houve busca em grade (*grid search*) com métrica formal.** Calibrar com conjunto de perguntas/respostas esperadas é trabalho das próximas semanas.

> 🗣️ **"O α é um botão: para um lado, entende o sentido; para o outro, acha o termo exato."**

---

## 8. Por que não treinar um LLM só do IFMG?

**Resposta curta:** porque o problema é de **consulta a documentos que mudam**, e treinar não resolve isso bem.

| Motivo | Explicação simples |
| :--- | :--- |
| **Poucos dados** | Alguns PDFs não bastam para treinar um modelo útil |
| **Custo** | Precisa de GPU forte, tempo e conhecimento específico; nosso servidor é modesto |
| **Normas mudam** | Cada nova resolução exigiria retreinar |
| **Alucinação continua** | Treinar não impede o modelo de inventar um prazo |
| **Sem fonte** | Não dá para dizer "isso está no Art. 12 do regulamento" |
| **Privacidade e manutenção** | Gerenciar versões de modelo treinado é trabalho extra |

**Treinar ≠ ensinar fatos.** *Fine-tuning* ajusta **estilo e formato**, não garante memorização correta de regras.

**E se insistirem?**
"Não é excludente. No futuro dá para ajustar o modelo para **chamar ferramentas com mais precisão** (problema que vimos nos 4B), mantendo o RAG para os fatos."

> 🗣️ **"Treinar é caro, lento, não cita fonte e fica desatualizado. RAG só pede para trocar o PDF."**

---

## 9. O que poderia ser acoplado no futuro?

| Ideia | Ganho |
| :--- | :--- |
| **Modelos maiores (8B/14B)** | Agente MCP mais estável, menos erro em *tool calling* |
| **Avaliação automática (RAGAS)** | Medir fidelidade e relevância com números, não só opinião |
| **Reranker (cross-encoder)** | Reordenar os top resultados com mais precisão |
| **Novos servidores MCP** | Calendário acadêmico, horários, contatos de setores (as perguntas que o sistema hoje recusa) |
| **Integração com SUAP** (com autenticação) | Respostas personalizadas (notas, histórico) *— exige cuidado com LGPD* |
| **Memória de conversa** | Perguntas de acompanhamento ("e no caso de estágio?") |
| **Mais cursos e documentos** | Cobrir todo o campus |
| **Novos canais** | WhatsApp/Telegram além do site |
| **Multiagente** | Um agente para normas, outro para calendário, outro para ementas |
| **Painel de feedback** | Usar 👍/👎 para melhorar o ranking de forma contínua |

> 🗣️ **"A arquitetura é modular: trocar o modelo ou plugar uma nova ferramenta MCP não exige refazer o sistema."**

---

## 10. Resumo do trabalho de Modran (2025)

**Referência:** Modran, H. A. *Leveraging RAG with ACP & MCP for Adaptive Intelligent Tutoring.* Applied Sciences, v. 15, n. 21, 2025.

> ⚠️ **Nota:** o resumo abaixo foi montado a partir da descrição pública do artigo. Confirme números e detalhes no PDF (`tcc/artigos/applsci-15-11443.pdf`) antes de citá-los.

### Em uma frase
Um **tutor inteligente** que junta **RAG + MCP + ACP** para responder com base em material do curso, lembrar o contexto do aluno e reduzir erros do modelo.

### O que ele propõe
- **RAG:** busca o material do curso para fundamentar a resposta;
- **MCP:** usado como **camada de contexto**: guarda o estado da sessão, objetivos do curso, erros anteriores do aluno e regras do professor;
- **ACP:** protocolo para **vários agentes** conversarem entre si (roteador, recuperação, política pedagógica, gerador);
- **Re-ranking com contexto:** além da similaridade, a nota considera o contexto do aluno, tags do professor e recência.

### Como foi avaliado (segundo a descrição pública)
- Base de teste com ~**240 perguntas/respostas** anotadas;
- Estudo com ~**36 estudantes e 12 professores** (cursos de STEM);
- Melhorou **Recall@1**, fidelidade de citação e reduziu afirmações sem fonte.

### Por que é o mais próximo do meu TCC (parte técnica)
| Ponto em comum | Modran | Meu TCC |
| :--- | :--- | :--- |
| Base | RAG | RAG |
| Protocolo | MCP | MCP |
| Objetivo | Reduzir alucinação e dar rastreabilidade | Idem |
| Reordenação dos resultados | Re-ranking com contexto (fusão linear de sinais) | RRF ponderado (α) + boost por intenção + penalidade por feedback negativo |
| Avaliação com pessoas | Alunos e professores | Alunos (grupo piloto) |

### Onde meu trabalho é diferente
| Ponto | Modran | Meu TCC |
| :--- | :--- | :--- |
| **Papel do MCP** | Guardar e fornecer **contexto pedagógico** do aluno | **Isolar a ferramenta de busca** em modo somente leitura |
| **Domínio** | Tutoria (ensinar, dar dicas) | Normas e documentos institucionais |
| **Agentes** | Rede multiagente (ACP) | Agente único |
| **Comparação interna** | Compara com RAG simples | Compara **RAG Clássico × RAG Agêntico (MCP)** |
| **Infraestrutura** | Protótipo em Python | **100% local** (Ollama), modelos de código aberto, hardware modesto |
| **Foco da pesquisa** | Qualidade pedagógica | **Trade-off latência × governança** em modelos pequenos (4B) |

> 🗣️ **"Modran usa o MCP para personalizar o ensino. Eu uso o MCP para blindar o acesso aos dados e comparar com o RAG simples, rodando tudo localmente."**

---

## Perguntas-surpresa (respostas rápidas)

| Pergunta | Resposta |
| :--- | :--- |
| **Como garantem que não alucina?** | Não garantimos 100%. Reduzimos: o modelo só vê os trechos recuperados e o *prompt* manda recusar o que não está neles. Avaliação formal (RAGAS) é trabalho futuro. |
| **Por que o MCP ficou mais lento?** | O agente faz mais passos: decide se busca, monta a chamada, executa, lê o resultado e só então responde (+47,7%). |
| **Por que o modelo é de 4B?** | É o que cabe no hardware disponível. É uma limitação declarada do trabalho. |
| **E se a pergunta não está nos documentos?** | O sistema recusa (ex.: horário de aula, telefone). Apareceu nos 👎 do grupo piloto. |
| **41 interações bastam?** | Para uma avaliação preliminar. A oficina na SNCT e as próximas semanas ampliam a amostra. |
| **Por que PostgreSQL e não um banco vetorial dedicado?** | Um único banco faz vetor + texto + dados da aplicação, com menos peças para manter. |
| **Por que HNSW?** | Busca aproximada rápida e aceita inserir documentos novos sem reconstruir o índice (diferente do IVFFlat). |
| **Por que Ollama?** | Roda modelos abertos localmente, com API simples. |
| **Dados dos alunos vazam?** | Não há envio para nuvem; modelo, banco e consultas ficam no servidor local. |
| **O que o sistema NÃO faz?** | Não acessa notas/históricos, não altera dados, não usa API paga. |
