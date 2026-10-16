---
marp: true
theme: default
paginate: true
size: 16:9
footer: 'IFMG Campus Ouro Branco — TCC II Sistemas de Informação (Daniel Silva & Ederson Júnior)'
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;600&display=swap');

  section {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 30px 48px;
    font-size: 17.5px;
    line-height: 1.42;
    background-color: #ffffff;
    color: #1f2937;
  }

  h1 {
    font-size: 29px;
    font-weight: 800;
    color: #1b5e20;
    margin-top: 0;
    margin-bottom: 14px;
    letter-spacing: -0.02em;
    border-bottom: 3px solid #2F9E41;
    padding-bottom: 6px;
  }

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #2F9E41;
    margin-top: 0;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-top: 0;
    margin-bottom: 6px;
  }

  p, li {
    font-size: 16.5px;
    color: #374151;
  }

  ul, ol {
    margin-top: 3px;
    margin-bottom: 6px;
    padding-left: 22px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    color: #111827;
    font-weight: 700;
  }

  footer {
    font-size: 11.5px;
    color: #6b7280;
    font-weight: 500;
  }

  /* Capa e Contracapa */
  section.capa {
    background: linear-gradient(135deg, #072610 0%, #134e1d 50%, #227933 100%) !important;
    color: #ffffff !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 45px 60px;
  }

  section.capa h1 {
    color: #ffffff !important;
    font-size: 34px;
    line-height: 1.25;
    border-bottom: 4px solid #4ade80;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  section.capa h2 {
    color: #bbf7d0 !important;
    font-size: 21px;
    font-weight: 600;
    margin-bottom: 18px;
  }

  section.capa p {
    color: #f0fdf4 !important;
    font-size: 18px;
    margin: 3px 0;
  }

  section.capa strong {
    color: #ffffff !important;
  }

  section.capa .meta-box {
    margin-top: 14px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.12);
    border-left: 4px solid #4ade80;
    border-radius: 8px;
  }

  /* Grids e Layouts Flexíveis */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: stretch;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    align-items: stretch;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 10px;
    align-items: stretch;
  }

  .card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .card-green {
    background: rgba(47, 158, 65, 0.05);
    border: 1px solid rgba(47, 158, 65, 0.3);
    border-left: 4px solid #2F9E41;
  }

  .card-purple {
    background: rgba(147, 51, 234, 0.05);
    border: 1px solid rgba(147, 51, 234, 0.3);
    border-left: 4px solid #9333ea;
  }

  .card-blue {
    background: rgba(2, 132, 199, 0.05);
    border: 1px solid rgba(2, 132, 199, 0.3);
    border-left: 4px solid #0284c7;
  }

  .card-amber {
    background: rgba(217, 119, 6, 0.05);
    border: 1px solid rgba(217, 119, 6, 0.3);
    border-left: 4px solid #d97706;
  }

  /* Espaçamento vertical entre blocos empilhados (grid/tabela + card de destaque) */
  section > .card {
    margin-top: 18px !important;
  }

  /* Coluna com cards empilhados, com espaçamento entre eles */
  .col-stack {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px !important;
  }

  .col-stack > .card {
    margin: 0 !important;
  }

  /* Destaque interno de um card (ex.: TTFT no slide 7) */
  .highlight-box {
    margin-top: 10px;
    padding: 8px 12px;
    background: rgba(47, 158, 65, 0.12);
    border-left: 3px solid #2F9E41;
    border-radius: 4px;
  }

  /* Tabelas */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    margin-top: 6px;
  }

  th {
    background: #1b5e20;
    color: #ffffff;
    padding: 6px 9px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 6px 9px;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
  }

  tr:nth-child(even) {
    background: #f9fafb;
  }

  .img-frame {
    width: 100%;
    border-radius: 6px;
    border: 1.5px solid #d1d5db;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    display: block;
  }

  .highlight-metric {
    font-size: 28px;
    font-weight: 800;
    color: #2F9E41;
    margin: 2px 0;
  }

  .tag {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .tag-green { background: #dcfce7; color: #166534; }
  .tag-red { background: #fee2e2; color: #991b1b; }
  .tag-blue { background: #e0f2fe; color: #075985; }
---

<!-- _class: capa -->
<!-- _paginate: false -->
<!-- _footer: '' -->

# Desenvolvimento e Avaliação Comparativa de Assistente Virtual Acadêmico
## RAG Clássico vs. Agentic RAG via Model Context Protocol (MCP)

<div class="meta-box">
  <p><strong>Apresentação Parcial do Trabalho de Conclusão de Curso (TCC II)</strong></p>
  <p><strong>Discente:</strong> Daniel G. D. Silva &nbsp;|&nbsp; <strong>Orientador:</strong> Prof. Me. Ederson N. F. G. Júnior</p>
  <p><strong>Instituição:</strong> Instituto Federal de Minas Gerais (IFMG) — Campus Ouro Branco</p>
  <p><strong>Curso:</strong> Bacharelado em Sistemas de Informação &nbsp;|&nbsp; <strong>Outubro de 2026</strong></p>
</div>

---

# Slide 1 — Introdução: Contextualização e Escopo

<div class="grid-2">
  <div class="card card-blue">
    <h3>Contextualização e Motivação</h3>
    <ul>
      <li><strong>Labirinto Normativo:</strong> Diretrizes acadêmicas dispersas em múltiplos PDFs extensos (PPCs, regulamentos de TCC, estágio, ementas e calendários);</li>
      <li><strong>Esforço Cognitivo:</strong> Alunos enfrentam barreiras para localizar regras operacionais de trancamento, pré-requisitos e atividades complementares;</li>
      <li><strong>Sobrecarga Administrativa:</strong> Demandas repetitivas sobrecarregam secretarias e coordenações de curso.</li>
    </ul>
  </div>

  <div class="card card-green">
    <h3>Escopo da Solução</h3>
    <table style="font-size: 13.5px;">
      <thead>
        <tr>
          <th style="width: 18%;">Dimensão</th>
          <th style="width: 41%;">O que o projeto faz</th>
          <th style="width: 41%;">O que o projeto não faz</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Fontes de dados</strong></td>
          <td><span class="tag tag-green">FAZ</span> Responde a dúvidas com base em documentos oficiais do campus (PPC, ementário e regulamentos).</td>
          <td><span class="tag tag-red">NÃO FAZ</span> Não acessa notas, histórico ou dados pessoais do aluno (SUAP).</td>
        </tr>
        <tr>
          <td><strong>Operação</strong></td>
          <td><span class="tag tag-green">FAZ</span> Somente consulta e leitura, comparando <strong>RAG Clássico</strong> e <strong>RAG Agêntico (MCP)</strong>.</td>
          <td><span class="tag tag-red">NÃO FAZ</span> Não altera cadastros nem executa solicitações, como trancamento de matrícula.</td>
        </tr>
        <tr>
          <td><strong>Infraestrutura</strong></td>
          <td><span class="tag tag-green">FAZ</span> Roda 100% em hardware local, com modelos de código aberto.</td>
          <td><span class="tag tag-red">NÃO FAZ</span> Não usa APIs pagas em nuvem, evitando custos e exposição de dados.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

---

# Slide 2 — Problema e Objetivos da Pesquisa

<div class="grid-2">
<div class="col-stack">
<div class="card card-amber">
  <h3 style="color: #92400e;">Descrição e Relevância do Problema</h3>
  <p style="margin: 0; font-size: 15px;">
    Modelos de linguagem generativos (LLMs) produzem respostas probabilísticas sujeitas a <strong>alucinações factuais</strong>, inventando prazos e normas inexistentes. Por outro lado, soluções baseadas em nuvem comercial geram custos em escala e fragilidade à privacidade. É imperativo investigar arquiteturas locais que garantam <strong>ancoramento factual rigoroso</strong>.
  </p>
</div>
<div class="card card-purple">
  <h3 style="color: #6b21a8;">Pergunta da Pesquisa</h3>
  <p style="margin: 0; font-size: 15px;">
    <em>"Como viabilizar um assistente virtual acadêmico 100% local e soberano, e quais são os <em>trade-offs</em> dessa abordagem em latência, governança e assertividade entre RAG Clássico e RAG Agêntico via MCP, utilizando modelos compactos em hardware modesto?"</em>
  </p>
</div>
</div>

<div class="card card-green">
  <h3>Objetivos do Trabalho</h3>
  <p style="font-size: 15px; margin-bottom: 6px;">
    <strong>Objetivo Geral:</strong> Projetar, implementar e avaliar comparativamente um assistente virtual acadêmico para o IFMG Campus Ouro Branco operando em infraestrutura local.
  </p>
  <p style="font-size: 14px; font-weight: 700; margin: 4px 0 2px 0;">Objetivos Específicos:</p>
  <ol style="font-size: 14px; padding-left: 18px;">
    <li>Estruturar pipeline de ingestão adaptativa com <em>chunking</em> semântico orientado ao domínio normativo;</li>
    <li>Implementar busca híbrida (BGE-M3 + FTS com RRF ponderado) e servidor MCP via <em>stdio</em> restrito;</li>
    <li>Desenvolver controle leve de concorrência em GPU (semáforo de VRAM) para execução estável;</li>
    <li>Mensurar latências de pipeline e realizar testes preliminares de campo com discentes.</li>
  </ol>
</div>
</div>

---

# Slide 3 — Trabalhos Relacionados e Diferencial da Proposta

<table>
  <thead>
    <tr>
      <th style="width: 20%;">Trabalho / Autor</th>
      <th style="width: 26%;">Abordagem Tecnológica</th>
      <th style="width: 27%;">Limitações Identificadas</th>
      <th style="width: 27%;">Diferencial da Nossa Proposta</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Helena / UFOP</strong><br><small>(Monteiro, 2021)</small></td>
      <td>PLN Tradicional via IBM Watson Assistant</td>
      <td>Mapeamento manual de intenções; fluxos rígidos que quebram com mudanças em resoluções</td>
      <td><strong>Extração Dinâmica via RAG:</strong> Atualização imediata com ingestão de novos regulamentos em PDF</td>
    </tr>
    <tr>
      <td><strong>PROGRAD / UFOP</strong><br><small>(Barbosa, 2023)</small></td>
      <td>RAG com LlamaIndex + ChatGPT (OpenAI)</td>
      <td>Custo recorrente por token em nuvem paga; dependência de conexão externa e dados de terceiros</td>
      <td><strong>Soberania e Privacidade:</strong> Execução 100% local (Ollama) com banco vetorial persistente</td>
    </tr>
    <tr>
      <td><strong>Tutoria Adaptativa</strong><br><small>(Modran, 2025)</small></td>
      <td>RAG + MCP e ACP para modulação pedagógica</td>
      <td>Foco em perfil de aprendizagem, sem isolamento formal de leitura nem auditoria estrita</td>
      <td><strong>Governança via MCP:</strong> Ferramentas isoladas operando em modo estrito de leitura (<em>read-only</em>)</td>
    </tr>
    <tr>
      <td><strong>Gestão OpenStack</strong><br><small>(Oliveira, 2025)</small></td>
      <td>Multiagente MCP para automação de infra</td>
      <td>Agentes com permissão de escrita/modificação ativa em serviços do sistema operacional</td>
      <td><strong>Auditabilidade Documental:</strong> Foco exclusivo em ancoramento factual com fontes explícitas</td>
    </tr>
  </tbody>
</table>

<div class="card card-green" style="margin-top: 10px; padding: 8px 14px;">
  <p style="margin: 0; font-size: 14.5px;">
    <strong>Viabilidade Real do <em>Self-Hosted</em>:</strong> o sistema roda em um servidor local (<em>homelab</em>) com GPU, usando um modelo compacto de 4B parâmetros, sem custo por token nem envio de dados a terceiros. Em testes, o RAG Clássico começou a responder em <strong>1,5 a 2,2 s</strong>, e um semáforo de VRAM mantém o serviço estável com requisições simultâneas. O mesmo ambiente comparou o <strong>RAG Clássico</strong> com o <strong>Agente MCP</strong>.
  </p>
</div>

---

# Slide 4 — Metodologia (1/3): Arquitetura e Tecnologias

<div class="grid-2" style="align-items: center;">
  <div>
    <h3>Pilha Tecnológica 100% Local e Soberana</h3>
    <ul>
      <li><strong>Estrutura em Monorepo (npm workspaces):</strong>
        <ul>
          <li><code>packages/web</code>: React 19 + TypeScript + Vite (interface web e streaming SSE);</li>
          <li><code>packages/api</code>: Backend Node.js/Express + controle assíncrono;</li>
          <li><code>packages/mcp-server</code>: Servidor de ferramentas isolado via protocolo MCP.</li>
        </ul>
      </li>
      <li><strong>Modelos de Inteligência Artificial (Ollama local):</strong>
        <ul>
          <li><strong>Qwen 3.5 4B:</strong> Reescrita de consulta, raciocínio agêntico e geração;</li>
          <li><strong>BGE-M3:</strong> Vetorização multilíngue densa (1024 dimensões).</li>
        </ul>
      </li>
      <li><strong>Banco Vetorial:</strong> PostgreSQL 16 + <em>pgvector</em> (índices HNSW).</li>
    </ul>
  </div>

  <div style="text-align: center;">
    <img src="figuras/pipeline_rag.png" alt="Fluxo do Pipeline RAG" style="max-height: 310px; max-width: 100%; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Figura 1: Arquitetura geral, fluxo de dados do pipeline RAG e ingestão.</p>
  </div>
</div>

---

# Slide 5 — Metodologia (2/3): Ingestão e Sanitização Adaptativa

<div class="grid-3">
  <div class="card card-blue">
    <h3>1. Extração Multiformato</h3>
    <p style="font-size: 14px; margin-bottom: 4px;">Leitura resiliente de documentos heterogêneos:</p>
    <ul style="font-size: 13.5px; padding-left: 16px;">
      <li><strong>PDF Estruturado:</strong> <em>LiteParse</em> preservando hierarquia de seções e títulos;</li>
      <li><strong>PDF Escaneado:</strong> OCR local via <em>tesseract.js</em>;</li>
      <li>Planilhas curriculares e matrizes em Markdown.</li>
    </ul>
  </div>

  <div class="card card-amber">
    <h3>2. Sanitização em 8 Etapas</h3>
    <ol style="font-size: 12.5px; padding-left: 16px; margin: 0;">
      <li>Filtragem de ruídos de OCR e caracteres nulos;</li>
      <li>Junção de hifenizações em quebra de linha;</li>
      <li>Poda de cabeçalhos e rodapés repetitivos;</li>
      <li>Eliminação de formulários em branco;</li>
      <li>Linearização textual de tabelas curriculares;</li>
      <li>Remoção de numeração isolada de páginas;</li>
      <li>Padronização formal antes de <em>Art.</em> e <em>Capítulo</em>;</li>
      <li>Normalização de espaços e pontuação.</li>
    </ol>
  </div>

  <div class="card card-green">
    <h3>3. Domain-Driven Chunking</h3>
    <p style="font-size: 14px; margin-bottom: 4px;">Segmentação orientada à semântica normativa:</p>
    <ul style="font-size: 13.5px; padding-left: 16px;">
      <li><strong>Syllabus Strategy:</strong> Disciplina completa mantida no mesmo chunk (código, ementa, créditos e bibliografia);</li>
      <li><strong>Normative Strategy:</strong> Preserva artigos, parágrafos e incisos sem fracionamento cego;</li>
      <li>Prefixo contextual injetado em cada vetor.</li>
    </ul>
  </div>
</div>

<div class="card card-purple" style="margin-top: 10px; padding: 8px 14px;">
  <p style="margin: 0; font-size: 13.5px;">
    <strong>Benefício Chave:</strong> Elimina a quebra de artigos regulamentares no meio de frases, problema comum em segmentações cegas baseadas apenas em contagem de caracteres.
  </p>
</div>

---

# Slide 6 — Metodologia (3/3): RAG Clássico vs. Agente MCP e GPU

<div class="grid-2">
  <div class="card card-green">
    <h3>RAG Clássico (Linear)</h3>
    <ul>
      <li><strong>Fluxo Determinístico:</strong> Reescrita de consulta $\to$ Busca Híbrida RRF $\to$ Síntese direta com streaming SSE;</li>
      <li><strong>Busca Híbrida Calibrada ($\alpha = 0,5$):</strong> Equilíbrio exato entre semântica vetorial (BGE-M3) e termos léxicos (FTS);</li>
      <li><strong>Menor Latência:</strong> Sem ciclos intermediários de decisão.</li>
    </ul>
  </div>

  <div class="card card-purple">
    <h3>RAG Agêntico via MCP (Autônomo)</h3>
    <ul>
      <li><strong>Comunicação via stdio:</strong> Processo desacoplado com contrato de schema JSON rigoroso;</li>
      <li><strong>Ferramenta Dedicada:</strong> <code>search_ifmg_knowledge</code> operando exclusivamente em modo de leitura (<em>read-only</em>);</li>
      <li><strong>Rastreabilidade de Fontes:</strong> Anexa metadados auditáveis com o nome do regulamento e trecho citado.</li>
    </ul>
  </div>
</div>

<div class="card card-amber" style="margin-top: 12px; padding: 10px 16px;">
  <h3 style="margin-top: 0; color: #92400e;">Engenharia de Concorrência: Semáforo Assíncrono de VRAM</h3>
  <p style="margin: 0; font-size: 14.5px;">
    Para prevenir travamentos por estouro de memória de vídeo (<em>Out-Of-Memory</em> — OOM) no servidor homelab, implementou-se um <strong>semáforo de concorrência em memória</strong> (<code>OLLAMA_MAX_CONCURRENT = 2</code>). Requisições excedentes são enfileiradas com timeout gracioso, dispensando dependências pesadas de corretores externos (Redis/RabbitMQ).
  </p>
</div>

---

# Slide 7 — Resultados Preliminares (1/3): Métricas de Latência

<div class="grid-2">
<div class="card card-blue">
  <h3 style="color: #0369a1;">Ambiente Computacional Homelab</h3>
  <ul>
    <li><strong>Servidor Local</strong> (Ubuntu 24.04, <em>self-hosted</em>):
      <ul>
        <li>CPU: AMD Ryzen 5 7500F (6 núcleos / 12 <em>threads</em>);</li>
        <li>GPU: NVIDIA RTX 5060 Ti, 16 GB de VRAM (CUDA);</li>
        <li>Memória RAM: 32 GB;</li>
        <li>Armazenamento: SSD de 512 GB (PCIe Gen3).</li>
      </ul>
    </li>
    <li><strong>Modelos Locais:</strong>
      <ul>
        <li>LLM: <em>Qwen 3.5 4B Instruct</em> (4 bilhões de parâmetros, contexto de 2048 <em>tokens</em>);</li>
        <li>Embeddings: <em>BGE-M3</em> (1024 dimensões).</li>
      </ul>
    </li>
    <li><strong>Banco de Dados:</strong> PostgreSQL 16 + pgvector (HNSW).</li>
  </ul>
  <div class="highlight-box">
    <p style="margin: 0; font-size: 13.5px; color: #166534;">
      <strong>Time To First Token (TTFT):</strong> Início de transmissão entre <strong>1,5 s e 2,2 s</strong> no RAG Clássico via SSE, garantindo percepção imediata de atividade.
    </p>
  </div>
</div>

<div>
  <h3>Tempos Médios por Etapa do Pipeline</h3>
  <table>
    <thead>
      <tr>
        <th>Etapa do Pipeline</th>
        <th>Componente / Modelo</th>
        <th>Latência Média</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Reescrita de Consulta</td>
        <td>Qwen 3.5 4B</td>
        <td>800 a 1500 ms</td>
      </tr>
      <tr>
        <td>Vetorização (Embedding)</td>
        <td>BGE-M3 (1024d)</td>
        <td>100 a 300 ms</td>
      </tr>
      <tr>
        <td>Busca Híbrida RRF</td>
        <td>PostgreSQL HNSW + FTS</td>
        <td><strong>50 a 120 ms</strong></td>
      </tr>
      <tr>
        <td><strong>Latência Total RAG Clássico</strong></td>
        <td>Geração Completa SSE</td>
        <td><strong>57,3 s (média)</strong></td>
      </tr>
      <tr>
        <td><strong>Latência Total Agente MCP</strong></td>
        <td>Turnos de Tool Calling</td>
        <td><strong>84,6 s (média)</strong></td>
      </tr>
    </tbody>
  </table>
  <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Sobretaxa de +47,7% (+27,3 s) no agente devido a múltiplos turnos inferenciais.</p>
</div>
</div>

---

# Slide 8 — Resultados Preliminares (2/3): Demonstração em Produção

<div class="grid-3">
  <div style="text-align: center;">
    <h3 style="font-size: 15px; margin-bottom: 4px;">1. Ingestão de Documentos</h3>
    <img src="figuras/print_upload_documentos.png" alt="Ingestão" class="img-frame" style="max-height: 240px; margin: 0 auto;">
    <p style="font-size: 12.5px; color: #4b5563; margin-top: 6px;">
      Indexação vetorial em produção: <strong>468+ chunks</strong> (PPC BSI, Ementário, Metalúrgica e TCC).
    </p>
  </div>

  <div style="text-align: center;">
    <h3 style="font-size: 15px; margin-bottom: 4px;">2. Modo RAG Clássico</h3>
    <img src="figuras/print_modo_rag.png" alt="RAG Clássico" class="img-frame" style="max-height: 240px; margin: 0 auto;">
    <p style="font-size: 12.5px; color: #4b5563; margin-top: 6px;">
      Consulta de pré-requisitos com resposta factual direta e botões de feedback discente.
    </p>
  </div>

  <div style="text-align: center;">
    <h3 style="font-size: 15px; margin-bottom: 4px;">3. Modo Agente MCP</h3>
    <img src="figuras/print_modo_agente.png" alt="Agente MCP" class="img-frame" style="max-height: 240px; margin: 0 auto;">
    <p style="font-size: 12.5px; color: #4b5563; margin-top: 6px;">
      Consulta sobre TCC com citação explícita das fontes oficiais auditadas via ferramenta.
    </p>
  </div>
</div>

<div class="card card-blue" style="margin-top: 8px; padding: 6px 14px; text-align: center;">
  <span style="font-size: 13.5px;">Sistema em execução online pública para validação: <strong>https://chat.danielgsilva.com.br/</strong></span>
</div>

---

# Slide 9 — Resultados Preliminares (3/3): Avaliação com Usuários

<div class="grid-3">
  <div class="card card-green">
    <h3>Amostragem em Campo</h3>
    <div class="highlight-metric">41 Interações</div>
    <p style="font-size: 13.5px; margin: 0;">Coleta real com grupo piloto discente:</p>
    <ul style="font-size: 13.5px; padding-left: 14px; margin-top: 4px;">
      <li><strong>RAG Clássico:</strong> 30 consultas (<strong>73,2%</strong>);</li>
      <li><strong>Agente MCP:</strong> 11 consultas (<strong>26,8%</strong>).</li>
    </ul>
    <p style="font-size: 12.5px; color: #4b5563; margin-top: 4px;">Preferência espontânea pela maior rapidez do RAG linear.</p>
  </div>

  <div class="card card-blue">
    <h3>Normas Mais Acionadas</h3>
    <ul style="font-size: 13px; padding-left: 16px;">
      <li><strong>PPCBSI_2022.pdf:</strong> 34 ativações diretas na base vetorial;</li>
      <li><strong>Ementario_BSI_2020.pdf:</strong> 29 ativações agregadas;</li>
      <li><strong>PPC_Metalurgica:</strong> 28 ativações;</li>
      <li><strong>Regulamento TCC:</strong> 4 ativações.</li>
    </ul>
  </div>

  <div class="card card-purple">
    <h3>Temáticas Consultadas</h3>
    <ul style="font-size: 13px; padding-left: 16px;">
      <li><strong>Matriz e Cursos:</strong> 9 consultas;</li>
      <li><strong>Ementas de Disciplinas:</strong> 8 consultas;</li>
      <li><strong>Normas de TCC e Estágio:</strong> 2 consultas;</li>
      <li><strong>Faltas e Avaliações:</strong> 2 consultas;</li>
      <li><strong>Consultas Gerais / Outras:</strong> 15 consultas.</li>
    </ul>
  </div>
</div>

<div class="card card-amber" style="margin-top: 10px; padding: 8px 14px;">
  <p style="margin: 0; font-size: 13.5px;">
    <strong>Análise Crítica dos Feedbacks:</strong> Respostas avaliadas positivamente (👍) relacionam-se a ementas e carga horária. Avaliações negativas (👎) decorreram de perguntas fora do escopo normativo (horários de aula, telefone da secretaria), em que o sistema corretamente recusou inventar informações.
  </p>
</div>

---

# Slide 10 — Discussões: Trade-Offs e Lições Aprendidas

<div class="grid-2">
  <div class="card card-green">
    <h3>Trade-Off: Latência vs. Governança</h3>
    <ul>
      <li><strong>RAG Clássico (Determinístico):</strong> Entrega menor tempo total e maior estabilidade em hardware modesto, sendo a escolha ideal para o cotidiano do aluno;</li>
      <li><strong>Agente MCP (Modular):</strong> Oferece governança formal, auditabilidade e rastreabilidade estrita de fontes, mas com sobretaxa temporal de +47,7%;</li>
      <li>A modularidade do MCP compensa quando se planeja expansão para múltiplos agentes e bancos regulatórios complexos.</li>
    </ul>
  </div>

  <div class="card card-amber">
    <h3>Desafios de Modelos Compactos (4B)</h3>
    <ul>
      <li><strong>Sensibilidade de Janela:</strong> Em modelos de 4 bilhões de parâmetros, a janela de contexto de 2048 tokens satura com rapidez em turnos sucessivos;</li>
      <li><strong>Sintaxe de Function Calling:</strong> Modelos 4B podem hesitar na chamada de ferramentas em perguntas ambíguas;</li>
      <li><strong>Alinhamento de Expectativas:</strong> Necessidade de orientar o aluno discente sobre o escopo regulamentar estático suportado pela aplicação.</li>
    </ul>
  </div>
</div>

<div class="card card-blue" style="margin-top: 10px; padding: 8px 14px;">
  <p style="margin: 0; font-size: 14px;">
    <strong>Síntese da Discussão:</strong> Em infraestrutura local compacta, o RAG Clássico é superior para consultas rápidas, enquanto o MCP estabelece as bases de governança que se beneficiarão do avanço para modelos 8B e superiores.
  </p>
</div>

---

# Slide 11 — Cronograma de Conclusão: Próximas Etapas (6 Semanas)

<div class="grid-4">
  <div class="card card-blue">
    <div class="tag tag-blue" style="margin-bottom: 6px;">Semanas 1 e 2</div>
    <h3 style="font-size: 15px;">Experimentos & Correções</h3>
    <ul style="font-size: 13px; padding-left: 14px;">
      <li>Oficina prática com alunos na <strong>SNCT 2026</strong> (coleta de novas avaliações);</li>
      <li>Refino de prompts para mitigar falhas de JSON em modelos 4B;</li>
      <li>Ajuste fino no semáforo de GPU.</li>
    </ul>
  </div>

  <div class="card card-green">
    <div class="tag tag-green" style="margin-bottom: 6px;">Semanas 3 e 4</div>
    <h3 style="font-size: 15px;">Análise & Redação</h3>
    <ul style="font-size: 13px; padding-left: 14px;">
      <li>Tabulação quantitativa e qualitativa dos novos feedbacks;</li>
      <li>Escrita detalhada da seção de <strong>Resultados e Discussão</strong> no artigo científico;</li>
      <li>Consolidação dos dados de latência e acurácia.</li>
    </ul>
  </div>

  <div class="card card-amber">
    <div class="tag tag-amber" style="margin-bottom: 6px;">Semana 5</div>
    <h3 style="font-size: 15px;">Conclusão & Limitações</h3>
    <ul style="font-size: 13px; padding-left: 14px;">
      <li>Redação da Conclusão e Limitações metodológicas;</li>
      <li>Detalhamento de <strong>Trabalhos Futuros</strong> (avaliação via RAGAS e modelos 8B/14B);</li>
      <li>Revisão do Resumo e Abstract do artigo.</li>
    </ul>
  </div>

  <div class="card card-purple">
    <div class="tag tag-green" style="margin-bottom: 6px;">Semana 6</div>
    <h3 style="font-size: 15px;">Revisão & Defesa</h3>
    <ul style="font-size: 13px; padding-left: 14px;">
      <li>Revisão textual rigorosa com o orientador;</li>
      <li>Ajustes finais de formatação do artigo segundo o modelo SBC;</li>
      <li>Preparação da apresentação final para a banca examinadora.</li>
    </ul>
  </div>
</div>

<div class="card card-green" style="margin-top: 12px; padding: 8px 14px;">
  <p style="margin: 0; font-size: 14px;">
    <strong>Situação Atual:</strong> O protótipo está 100% funcional em produção. As próximas 6 semanas consolidarão os dados experimentais, correções e a redação científica definitiva do artigo.
  </p>
</div>

---

# Slide 12 — Referências Bibliográficas

<ul style="font-size: 13px; line-height: 1.45;">
  <li><strong>Anthropic.</strong> <em>Model Context Protocol (MCP) Specification</em>, 2024. Disponível em: &lt;https://modelcontextprotocol.io&gt;.</li>
  <li><strong>Barbosa, L. S.</strong> <em>Um Chatbot Especializado para o Contexto da Universidade Federal de Ouro Preto</em>. Monografia (Bacharelado em Ciência da Computação) — UFOP, Ouro Preto, 2023.</li>
  <li><strong>Chen, J. et al.</strong> <em>BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation</em>. arXiv preprint arXiv:2402.03216, 2024.</li>
  <li><strong>Cormack, G. V.; Clarke, C. L. A.; Büttcher, S.</strong> Reciprocal rank fusion outperforms condorcet and individual rank learning methods. In: <em>Proceedings of the 32nd International ACM SIGIR Conference</em>, p. 758–759, 2009.</li>
  <li><strong>IFMG Campus Ouro Branco.</strong> <em>Projeto Pedagógico do Curso de Bacharelado em Sistemas de Informação (PPCBSI)</em>, 2022.</li>
  <li><strong>Lewis, P. et al.</strong> Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. In: <em>Advances in Neural Information Processing Systems (NeurIPS)</em>, v. 33, p. 9459–9474, 2020.</li>
  <li><strong>Modran, H. A.</strong> Leveraging RAG with ACP & MCP for Adaptive Intelligent Tutoring. <em>Applied Sciences</em>, MDPI, v. 15, n. 21, p. 11443, 2025.</li>
  <li><strong>Monteiro, G. S.</strong> <em>Helena: Um chatbot para auxílio dos discentes do DECOM em trâmites universitários</em>. Monografia (Bacharelado em Ciência da Computação) — UFOP, Ouro Preto, 2021.</li>
  <li><strong>Oliveira, I. K. S.</strong> <em>Uma Arquitetura Multiagente para Orquestração Automática em Infraestruturas OpenStack</em>. TCC (Bacharelado em Engenharia de Computação) — IFPB, Campina Grande, 2025.</li>
</ul>

---

<!-- _class: capa -->
<!-- _paginate: false -->
<!-- _footer: '' -->

# Muito Obrigado!

## Chat Assistente Virtual Acadêmico — IFMG Campus Ouro Branco

<div class="meta-box" style="margin-top: 20px;">
  <p><strong>Discente:</strong> Daniel G. D. Silva (<a href="mailto:daniel24maio@gmail.com" style="color: #4ade80;">daniel24maio@gmail.com</a>)</p>
  <p><strong>Orientador:</strong> Prof. Me. Ederson N. F. G. Júnior (<a href="mailto:ederson.junior@ifmg.edu.br" style="color: #4ade80;">ederson.junior@ifmg.edu.br</a>)</p>
  <p style="margin-top: 8px;"><strong>Aplicação em Produção:</strong> <a href="https://chat.danielgsilva.com.br/" style="color: #ffffff; text-decoration: underline;">https://chat.danielgsilva.com.br/</a></p>
</div>

<div style="margin-top: 20px; font-size: 20px; color: #dcfce7; font-weight: 600;">
  Estamos à disposição da banca examinadora para perguntas e apontamentos.
</div>
