import base64
import os

def get_base64_img(rel_path):
    with open(rel_path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

rag_img = get_base64_img("docs/figuras/print_modo_rag.png")
agente_img = get_base64_img("docs/figuras/print_modo_agente.png")

html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Guia de Instruções e Teste — Chat Assistente Virtual IFMG</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  @page {{
    size: A4;
    margin: 12mm 14mm 12mm 14mm;
    @bottom-right {{
      content: "Página " counter(page) " de " counter(pages);
      font-size: 8pt;
      color: #64748b;
      font-family: 'Inter', sans-serif;
    }}
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.45;
    font-size: 9pt;
    background-color: #ffffff;
  }}

  /* HEADER */
  .header {{
    border-bottom: 2.5px solid #006633;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }}

  .header-left {{
    flex: 1;
  }}

  .inst-tag {{
    display: inline-block;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #006633;
    background: #e8f5e9;
    padding: 2px 7px;
    border-radius: 4px;
    margin-bottom: 3px;
  }}

  h1 {{
    font-size: 14.5pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 3px;
  }}

  .sub-title {{
    font-size: 8.5pt;
    color: #475569;
    font-weight: 500;
  }}

  .header-meta {{
    text-align: right;
    font-size: 7.8pt;
    color: #64748b;
    line-height: 1.35;
  }}

  /* BANNER */
  .app-banner {{
    background: linear-gradient(135deg, #006633 0%, #004d26 100%);
    color: white;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}

  .app-banner-info h2 {{
    font-size: 10.5pt;
    font-weight: 700;
    margin-bottom: 2px;
  }}

  .app-banner-info p {{
    font-size: 8pt;
    opacity: 0.92;
  }}

  .app-url-pill {{
    background: white;
    color: #006633;
    font-weight: 700;
    font-size: 8.5pt;
    padding: 5px 12px;
    border-radius: 16px;
    text-decoration: none;
    white-space: nowrap;
    border: 1px solid rgba(255,255,255,0.8);
  }}

  /* SECTION TITLES */
  h2.section-title {{
    font-size: 10.8pt;
    font-weight: 700;
    color: #0f172a;
    border-left: 3.5px solid #006633;
    padding-left: 7px;
    margin-top: 10px;
    margin-bottom: 6px;
  }}

  p {{
    margin-bottom: 6px;
    text-align: justify;
  }}

  /* CARDS GRID */
  .card-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }}

  .mode-card {{
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    background: #f8fafc;
  }}

  .mode-card.rag {{
    border-top: 3.5px solid #16a34a;
  }}

  .mode-card.agente {{
    border-top: 3.5px solid #7c3aed;
  }}

  .mode-badge {{
    display: inline-block;
    font-weight: 700;
    font-size: 7.8pt;
    padding: 2px 7px;
    border-radius: 10px;
    margin-bottom: 4px;
  }}

  .badge-rag {{
    background: #dcfce7;
    color: #15803d;
  }}

  .badge-agente {{
    background: #f3e8ff;
    color: #6b21a8;
  }}

  .mode-card h3 {{
    font-size: 9pt;
    font-weight: 700;
    margin-bottom: 3px;
    color: #0f172a;
  }}

  .mode-card ul {{
    padding-left: 14px;
    font-size: 8pt;
    color: #334155;
    margin-bottom: 6px;
  }}

  .mode-card li {{
    margin-bottom: 2px;
  }}

  .figure-box {{
    margin-top: 4px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 4px;
  }}

  .figure-box img {{
    max-width: 100%;
    height: auto;
    border-radius: 3px;
    display: block;
    margin: 0 auto;
    max-height: 125px;
  }}

  .figure-caption {{
    font-size: 7pt;
    color: #64748b;
    margin-top: 3px;
    font-style: italic;
  }}

  /* FEEDBACK BOX */
  .feedback-box {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 8px;
    margin-bottom: 8px;
  }}

  .vote-badge {{
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    padding: 1px 6px;
    font-size: 7.8pt;
    font-weight: 600;
  }}

  /* STEPS */
  .steps-list {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 10px;
  }}

  .step-item {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
  }}

  .step-num {{
    display: inline-block;
    width: 19px;
    height: 19px;
    background: #006633;
    color: white;
    border-radius: 50%;
    text-align: center;
    line-height: 19px;
    font-size: 7.5pt;
    font-weight: 700;
    margin-bottom: 3px;
  }}

  .step-item h4 {{
    font-size: 8.3pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }}

  .step-item p {{
    font-size: 7.5pt;
    color: #475569;
    line-height: 1.3;
    margin: 0;
  }}

  /* QUESTIONS TABLE */
  .table-questions {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 7.8pt;
  }}

  .table-questions th {{
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 5px 7px;
    border: 1px solid #cbd5e1;
  }}

  .table-questions td {{
    padding: 4px 7px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
    line-height: 1.35;
  }}

  .table-questions tr:nth-child(even) td {{
    background: #f8fafc;
  }}

  .cat-badge {{
    font-weight: 700;
    color: #006633;
    white-space: nowrap;
    font-size: 8pt;
  }}

  /* QUESTIONNAIRE EXPLANATION GRID */
  .survey-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }}

  .survey-item-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
    font-size: 7.8pt;
  }}

  .survey-item-card strong {{
    color: #0f172a;
  }}

  /* SURVEY CTA */
  .survey-cta {{
    background: #eff6ff;
    border: 1.5px dashed #3b82f6;
    border-radius: 6px;
    padding: 10px 14px;
    margin-top: 8px;
    text-align: center;
  }}

  .survey-cta h3 {{
    font-size: 10pt;
    font-weight: 700;
    color: #1d4ed8;
    margin-bottom: 3px;
  }}

  .survey-cta p {{
    font-size: 8pt;
    color: #1e3a8a;
    margin-bottom: 6px;
    line-height: 1.35;
  }}

  .survey-link {{
    display: inline-block;
    background: #2563eb;
    color: white;
    font-weight: 700;
    font-size: 8.8pt;
    padding: 6px 16px;
    border-radius: 4px;
    text-decoration: none;
  }}

  .page-break {{
    page-break-before: always;
  }}

  .avoid-break {{
    page-break-inside: avoid;
  }}

  .footer-note {{
    margin-top: 10px;
    font-size: 7.2pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 5px;
    text-align: center;
  }}
</style>
</head>
<body>

  <!-- ==================== PÁGINA 1 ==================== -->

  <!-- CABEÇALHO -->
  <div class="header">
    <div class="header-left">
      <span class="inst-tag">IFMG • Campus Ouro Branco</span>
      <h1>Guia de Instruções e Teste — Assistente Virtual IFMG</h1>
      <div class="sub-title">Trabalho de Conclusão de Curso (TCC) — Bacharelado em Sistemas de Informação</div>
    </div>
    <div class="header-meta">
      <strong>Autores:</strong> Daniel G. D. Silva e Ederson N. F. G. Júnior<br>
      <strong>Orientador:</strong> Prof. Dr. Saul Silva Delabrida<br>
      <strong>Aplicação Web:</strong> chat.danielgsilva.com.br
    </div>
  </div>

  <!-- BANNER COM LINK -->
  <div class="app-banner">
    <div class="app-banner-info">
      <h2>Acesse a Aplicação: https://chat.danielgsilva.com.br/</h2>
      <p>Disponível em computadores e smartphones (Google Chrome, Edge, Firefox e Safari).</p>
    </div>
    <a href="https://chat.danielgsilva.com.br/" class="app-url-pill">ABRIR O CHAT</a>
  </div>

  <!-- SEÇÃO 1: O QUE É O CHAT -->
  <h2 class="section-title">1. O que é o Chat Assistente Virtual IFMG?</h2>
  <p>
    O <strong>Chat Assistente Virtual IFMG</strong> é uma plataforma acadêmica de Inteligência Artificial voltada a facilitar o acesso imediato às normas e regulamentos do <em>Campus Ouro Branco</em>. Em vez de ler dezenas de páginas de documentos PDF extensos, alunos e professores podem esclarecer dúvidas enviando perguntas em linguagem natural diretamente no chat.
  </p>
  <p>
    <strong>Base de Conhecimento Cadastrada:</strong>
    Regulamento Didático do Ensino Superior do IFMG (regras de aprovação, cálculo de notas, trancamento, regime especial), Regulamento Geral de TCC e Estágio Supervisionado, e os <strong>Projetos Pedagógicos de Curso (PPCs)</strong> de todos os cursos de graduação do campus: <em>Bacharelado em Sistemas de Informação (BSI)</em>, <em>Bacharelado em Administração</em>, <em>Engenharia Metalúrgica</em> e <em>Licenciatura em Pedagogia</em>.
  </p>
  <p style="font-size: 8.2pt; color: #475569;">
    <strong>Privacidade e Execução Local:</strong> O assistente opera sobre um modelo de linguagem aberto e compacto de 4 bilhões de parâmetros hospedado inteiramente em infraestrutura local própria, garantindo soberania institucional, ausência de custos por mensagem e proteção aos dados dos usuários.
  </p>

  <!-- SEÇÃO 2: COMO UTILIZAR E TROCAR OS MODOS -->
  <h2 class="section-title">2. Como Utilizar e Alternar entre os Modos (RAG Clássico vs Agente MCP)</h2>
  <p>
    O sistema possui <strong>duas abordagens de inteligência artificial</strong> implementadas para fins de pesquisa comparativa. Você pode alternar entre elas com um clique no botão localizado no <strong>canto superior direito</strong>:
  </p>

  <div class="card-grid avoid-break">
    <!-- MODO RAG -->
    <div class="mode-card rag">
      <span class="mode-badge badge-rag">[ 📚 RAG ] — Botão Verde</span>
      <h3>Modo RAG Clássico (Linear e Ágil)</h3>
      <ul>
        <li><strong>Funcionamento:</strong> Consulta rápida no banco de vetores e geração direta.</li>
        <li><strong>Experiência:</strong> Início de digitação ágil (baixa latência de espera).</li>
        <li><strong>Sinalização:</strong> Exibe a etiqueta <em>"⚡ Modo: RAG Clássico"</em>.</li>
      </ul>
      <div class="figure-box">
        <img src="{rag_img}" alt="Modo RAG Clássico">
        <div class="figure-caption">Figura 1: Interface no Modo RAG Clássico (botão verde no topo).</div>
      </div>
    </div>

    <!-- MODO AGENTE MCP -->
    <div class="mode-card agente">
      <span class="mode-badge badge-agente">[ 🤖 Agente ] — Botão Roxo</span>
      <h3>Modo Agente MCP (Raciocínio e Fontes)</h3>
      <ul>
        <li><strong>Funcionamento:</strong> Agente autônomo governado pelo protocolo MCP.</li>
        <li><strong>Transparência:</strong> Raciocina, aciona buscas e exibe os documentos oficiais.</li>
        <li><strong>Sinalização:</strong> Exibe <em>"🤖 Modo: Agente MCP"</em> e <em>"📚 Fontes: [...]"</em>.</li>
      </ul>
      <div class="figure-box">
        <img src="{agente_img}" alt="Modo Agente MCP">
        <div class="figure-caption">Figura 2: Interface no Modo Agente MCP (botão roxo e fontes citadas).</div>
      </div>
    </div>
  </div>

  <!-- SEÇÃO 3: FEEDBACK NAS RESPOSTAS -->
  <div class="feedback-box avoid-break">
    <h3 style="font-size: 9.3pt; color: #166534; font-weight: 700; margin-bottom: 3px;">
      3. Onde Clicar para Demonstrar se Concorda ou Discorda da Resposta?
    </h3>
    <p style="font-size: 8.2pt; color: #14532d; margin-bottom: 5px;">
      Ao final de <strong>cada resposta gerada</strong>, há dois botões de voto instantâneo:
    </p>
    <div style="display: flex; gap: 8px;">
      <div style="flex: 1; background: white; border: 1px solid #86efac; border-radius: 5px; padding: 5px 8px;">
        <span class="vote-badge" style="color: #16a34a;">👍 Útil / Concordo</span>
        <p style="font-size: 7.5pt; color: #15803d; margin: 2px 0 0 0;">
          Clique se a resposta foi direta, clara e esclareceu sua dúvida conforme a norma.
        </p>
      </div>
      <div style="flex: 1; background: white; border: 1px solid #fca5a5; border-radius: 5px; padding: 5px 8px;">
        <span class="vote-badge" style="color: #dc2626;">👎 Não Útil / Discordo</span>
        <p style="font-size: 7.5pt; color: #b91c1c; margin: 2px 0 0 0;">
          Clique se a resposta tiver erro, omitir pré-requisito ou apresentar inconsistência.
        </p>
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 2 ==================== -->
  <div class="page-break"></div>

  <!-- SEÇÃO 4: ROTEIRO PRÁTICO -->
  <h2 class="section-title">4. Roteiro Prático de Teste (Duração: 5 a 7 minutos)</h2>
  <div class="steps-list avoid-break">
    <div class="step-item">
      <span class="step-num">1</span>
      <h4>Escolha 2 Dúvidas</h4>
      <p>Selecione 2 perguntas da tabela abaixo (ou formule dúvidas reais sobre seu curso/normas).</p>
    </div>
    <div class="step-item">
      <span class="step-num">2</span>
      <h4>Envie no 1º Modo</h4>
      <p>Envie as 2 perguntas no modo ativo (ex: RAG). Leia e vote <span class="vote-badge">👍</span> ou <span class="vote-badge">👎</span> em cada resposta.</p>
    </div>
    <div class="step-item">
      <span class="step-num">3</span>
      <h4>Troque o Modo</h4>
      <p>Recarregue a página, mude para o 2º modo no topo e repita <strong>as mesmas 2 perguntas</strong>, votando 👍 ou 👎.</p>
    </div>
    <div class="step-item">
      <span class="step-num">4</span>
      <h4>Dê seu Feedback</h4>
      <p>Abra o formulário de avaliação online na Página 3 para registrar sua percepção comparativa.</p>
    </div>
  </div>

  <!-- SEÇÃO 5: EXEMPLOS DE PERGUNTAS -->
  <h2 class="section-title">5. Sugestões de Perguntas para Testar (6 Exemplos por Grupo)</h2>
  <p style="font-size: 8pt; color: #475569; margin-bottom: 6px;">
    Para facilitar a interação e confrontar as versões, sugerimos utilizar as perguntas abaixo:
  </p>

  <table class="table-questions avoid-break">
    <thead>
      <tr>
        <th style="width: 26%;">Público / Curso</th>
        <th style="width: 74%;">6 Sugestões de Perguntas Acadêmicas para Interação</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <span class="cat-badge">Normas Gerais</span><br>
          <small style="color: #64748b;">(Todos os cursos e docentes)</small>
        </td>
        <td>
          1. Qual a frequência mínima exigida para ser aprovado em uma disciplina?<br>
          2. Qual a nota mínima para aprovação e como funciona o exame final?<br>
          3. Como funciona o processo de trancamento total ou parcial de matrícula?<br>
          4. Posso aproveitar disciplinas cursadas em outra instituição? Como solicitar?<br>
          5. Perdi uma avaliação por motivo justificado. Como peço segunda chamada?<br>
          6. Qual é o prazo máximo de integralização curricular para concluir o curso?
        </td>
      </tr>
      <tr>
        <td>
          <span class="cat-badge">Sistemas de Informação</span><br>
          <small style="color: #64748b;">(Discentes BSI)</small>
        </td>
        <td>
          1. Quais são os pré-requisitos para cursar Banco de Dados I?<br>
          2. Quais disciplinas compõem a grade curricular do 4º período?<br>
          3. Quantas horas de Atividades Complementares (ACG) são obrigatórias?<br>
          4. O estágio é obrigatório para os alunos de BSI? Qual a carga horária mínima?<br>
          5. Qual é o conteúdo programático da disciplina de Inteligência Artificial?<br>
          6. Quantas horas de disciplinas optativas preciso cumprir para me formar?
        </td>
      </tr>
      <tr>
        <td>
          <span class="cat-badge">Administração</span><br>
          <small style="color: #64748b;">(Discentes ADM)</small>
        </td>
        <td>
          1. Quais disciplinas fazem parte da grade do 1º período de Administração?<br>
          2. Qual é a carga horária mínima e as regras do estágio supervisionado?<br>
          3. Quantas horas de atividades complementares preciso comprovar?<br>
          4. Quais são os pré-requisitos obrigatórios para ingressar no TCC?<br>
          5. O que é estudado nas disciplinas introdutórias de contabilidade e gestão?<br>
          6. Qual a carga horária total da matriz curricular e o tempo sugerido de curso?
        </td>
      </tr>
      <tr>
        <td>
          <span class="cat-badge">Engenharia Metalúrgica</span><br>
          <small style="color: #64748b;">(Discentes Metalurgia)</small>
        </td>
        <td>
          1. O estágio é obrigatório no curso? Qual a carga horária mínima exigida?<br>
          2. Quais são os pré-requisitos necessários para matricular no TCC?<br>
          3. Quais disciplinas compõem a matriz curricular do 1º período?<br>
          4. O que é abordado na ementa da disciplina de Termodinâmica Metalúrgica?<br>
          5. Quantas horas de atividades complementares devem ser integralizadas?<br>
          6. Qual a carga horária total da formação em Engenharia Metalúrgica?
        </td>
      </tr>
      <tr>
        <td>
          <span class="cat-badge">Licenciatura em Pedagogia</span><br>
          <small style="color: #64748b;">(Discentes Pedagogia)</small>
        </td>
        <td>
          1. Como é organizado o estágio supervisionado e em quais etapas ele ocorre?<br>
          2. Quantas horas de atividades complementares de graduação são requeridas?<br>
          3. Quais matérias compõem a grade curricular inicial do 1º período?<br>
          4. Como funciona a Prática como Componente Curricular (PCC) no curso?<br>
          5. O que é ensinado na disciplina de Didática Geral?<br>
          6. Quais são as normas para elaboração e defesa do Trabalho de Conclusão de Curso?
        </td>
      </tr>
      <tr>
        <td>
          <span class="cat-badge">Docentes e Gestão</span><br>
          <small style="color: #64748b;">(Professores e Coordenadores)</small>
        </td>
        <td>
          1. Quais são as atribuições formais do professor orientador de TCC?<br>
          2. Como deve ser constituída a banca examinadora de defesa de TCC?<br>
          3. Qual o prazo regulamentar para o lançamento de notas e frequências no sistema?<br>
          4. Em quais hipóteses o discente possui amparo para regime especial ou 2ª chamada?<br>
          5. Qual o procedimento para um aluno protocolar pedido formal de revisão de nota?<br>
          6. Qual o limite máximo de carga horária na modalidade a distância em cursos presenciais?
        </td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== PÁGINA 3 ==================== -->
  <div class="page-break"></div>

  <!-- SEÇÃO 6: O QUESTIONÁRIO OFICIAL -->
  <h2 class="section-title">6. Formulário de Avaliação e Coleta de Feedback (Questionário Unificado)</h2>
  <p>
    Para confrontar rigorosamente as duas versões do assistente e embasar a pesquisa científica do TCC, foi elaborado um <strong>Questionário Unificado de Avaliação</strong>. Tanto discentes quanto docentes respondem ao mesmo instrumento estruturado, que leva cerca de <strong>2 a 3 minutos</strong> para ser concluído.
  </p>

  <p style="font-size: 8.2pt; color: #475569; margin-bottom: 8px;">
    <strong>Resumo das 11 Questões do Formulário (O que você avaliará):</strong>
  </p>

  <div class="survey-grid avoid-break">
    <div class="survey-item-card">
      <strong>[Q1] Perfil do Respondente:</strong> Identificação do seu curso de graduação (BSI, Administração, Eng. Metalúrgica ou Pedagogia) e fase, ou opção "Docente / Servidor".
    </div>
    <div class="survey-item-card">
      <strong>[Q2 e Q3] Modo RAG Clássico:</strong> Avaliação em escala de 1 a 5 da velocidade de resposta e da clareza/precisão das respostas recebidas no modo verde.
    </div>
    <div class="survey-item-card">
      <strong>[Q4 e Q5] Modo Agente MCP:</strong> Avaliação em escala de 1 a 5 da velocidade e da clareza/precisão das respostas no modo roxo (permitindo confronto pareado direto).
    </div>
    <div class="survey-item-card">
      <strong>[Q6] Auditoria de Alucinações:</strong> Classificação da fidelidade: totalmente confiável, recusa correta em temas fora da base, divergência leve ou alucinação factual evidente.
    </div>
    <div class="survey-item-card">
      <strong>[Q7] Confronto e Coerência:</strong> Comparação direta: em qual dos dois modos você percebeu respostas mais assertivas e coerentes com as normas, ou se prefere ambos disponíveis.
    </div>
    <div class="survey-item-card">
      <strong>[Q8] Usabilidade (TAM):</strong> Facilidade percebida de uso da interface web, alternância de modos no cabeçalho e legibilidade em desktop e celular.
    </div>
    <div class="survey-item-card">
      <strong>[Q9] Utilidade Institucional:</strong> Em que medida o chat reduz idas à secretaria/coordenação e dispensa a leitura manual de PDFs extensos.
    </div>
    <div class="survey-item-card">
      <strong>[Q10] Novas Ferramentas MCP (Futuro):</strong> Múltipla escolha de serviços desejados: transporte/ônibus, cardápio do refeitório, salas e blocos, diretório de e-mails de professores, avisos e editais de bolsas.
    </div>
  </div>

  <div class="survey-item-card avoid-break" style="margin-bottom: 10px;">
    <strong>[Q11] Auditoria de Falhas e Sugestões Livres:</strong> Espaço aberto para colar perguntas em que o assistente falhou ou errou (alimentando o <em>Golden Dataset</em> de melhoria contínua) e deixar suas críticas e sugestões gerais.
  </div>

  <!-- CHAMADA PARA AÇÃO FINAL -->
  <div class="survey-cta avoid-break">
    <h3>📝 Link de Acesso ao Formulário de Avaliação</h3>
    <p>
      Sua opinião é indispensável para o sucesso do Trabalho de Conclusão de Curso e para a melhoria dos serviços acadêmicos do IFMG Campus Ouro Branco. Após testar as duas perguntas nos dois modos do chat, clique no botão abaixo:
    </p>
    <div style="margin: 8px 0;">
      <a href="https://forms.gle/exemploQuestionarioTCC" class="survey-link">
        CLIQUE AQUI PARA PREENCHER O FORMULÁRIO DE FEEDBACK
      </a>
    </div>
    <p style="font-size: 7.5pt; color: #475569; margin-top: 4px; margin-bottom: 0;">
      * Caso o link acima não abra automaticamente no seu leitor de PDF, utilize o link compartilhado via e-mail ou grupo institucional da sua turma/colegiado.
    </p>
  </div>

  <div class="footer-note">
    <strong>Instituto Federal de Minas Gerais (IFMG) — Campus Ouro Branco</strong><br>
    Trabalho de Conclusão de Curso em Bacharelado em Sistemas de Informação • Outubro de 2026<br>
    Agradecemos imensamente pela sua colaboração e tempo dedicado!
  </div>

</body>
</html>
"""

html_path = "docs/guia_instrucoes_chat_ifmg.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML otimizado gerado com sucesso em {html_path}")
