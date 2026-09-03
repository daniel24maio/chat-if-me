import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1020 390" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Times New Roman', Times, serif;">
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1d4ed8" />
    </marker>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#c2410c" />
    </marker>
    <marker id="arrow-teal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f766e" />
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4b5563" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- ================= CONTAINER 1: RECUPERAÇÃO ================= -->
  <g transform="translate(20, 20)">
    <!-- Container Box -->
    <rect x="0" y="0" width="300" height="350" rx="8" fill="#f8fafc" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="5,5" />
    <!-- Header Badge (dentro do tracejado) -->
    <rect x="40" y="12" width="220" height="26" rx="4" fill="#dbeafe" stroke="#bfdbfe" stroke-width="1"/>
    <text x="150" y="29" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle" font-family="sans-serif">1. RECUPERAÇÃO (RETRIEVAL)</text>

    <!-- Node: Consulta do Discente -->
    <g transform="translate(20, 50)">
      <rect x="0" y="0" width="260" height="52" rx="6" fill="#ffffff" stroke="#64748b" stroke-width="1.2" filter="url(#shadow)"/>
      <text x="130" y="22" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">Consulta do Discente</text>
      <text x="130" y="38" font-size="11" font-style="italic" fill="#475569" text-anchor="middle">"Quais os critérios do TCC?"</text>
    </g>

    <!-- Arrow Query -> Search -->
    <path d="M 150 102 L 150 126" fill="none" stroke="#4b5563" stroke-width="1.5" marker-end="url(#arrow-gray)"/>

    <!-- Node: Busca Híbrida -->
    <g transform="translate(20, 128)">
      <rect x="0" y="0" width="260" height="62" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="130" y="24" font-size="12.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Busca Híbrida RRF</text>
      <text x="130" y="42" font-size="10.5" fill="#3b82f6" text-anchor="middle">Vetorial (HNSW) + Léxica (FTS)</text>
      <text x="130" y="54" font-size="9.5" font-weight="bold" fill="#1d4ed8" text-anchor="middle">Fusão por Rank Recíproco (RRF)</text>
    </g>

    <!-- Clear Dual Arrows Search <-> Base -->
    <!-- Down Arrow: Consulta -->
    <path d="M 100 190 L 100 248" fill="none" stroke="#1d4ed8" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
    <text x="92" y="222" font-size="9.5" font-weight="bold" fill="#1e40af" text-anchor="end">Consulta</text>

    <!-- Up Arrow: Fragmentos -->
    <path d="M 200 248 L 200 190" fill="none" stroke="#1d4ed8" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
    <text x="208" y="222" font-size="9.5" font-weight="bold" fill="#1e40af" text-anchor="start">Fragmentos</text>

    <!-- Node: Base de Conhecimento -->
    <g transform="translate(20, 250)">
      <rect x="0" y="0" width="260" height="64" rx="6" fill="#ffffff" stroke="#3b82f6" stroke-width="1.2" filter="url(#shadow)"/>
      <text x="130" y="26" font-size="12.5" font-weight="bold" fill="#1e3a8a" text-anchor="middle">Base Documental</text>
      <text x="130" y="44" font-size="10.5" fill="#475569" text-anchor="middle">Regulamentos e PPCs Sanitizados</text>
      <text x="130" y="56" font-size="9.5" fill="#64748b" text-anchor="middle">Tabelas Vetoriais (pgvector)</text>
    </g>
  </g>

  <!-- ================= CONTAINER 2: ENRIQUECIMENTO ================= -->
  <g transform="translate(360, 20)">
    <!-- Container Box -->
    <rect x="0" y="0" width="300" height="350" rx="8" fill="#fffdfa" stroke="#fed7aa" stroke-width="1.5" stroke-dasharray="5,5" />
    <!-- Header Badge (dentro do tracejado com margem ampliada) -->
    <rect x="30" y="12" width="240" height="26" rx="4" fill="#ffedd5" stroke="#fed7aa" stroke-width="1"/>
    <text x="150" y="29" font-size="12" font-weight="bold" fill="#c2410c" text-anchor="middle" font-family="sans-serif">2. ENRIQUECIMENTO (AUGMENTATION)</text>

    <!-- Node: Prompt Estruturado Card -->
    <g transform="translate(15, 50)">
      <rect x="0" y="0" width="270" height="264" rx="8" fill="#ffffff" stroke="#ea580c" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="135" y="26" font-size="12.5" font-weight="bold" fill="#9a3412" text-anchor="middle">Montagem do Prompt Estruturado</text>
      <line x1="20" y1="36" x2="250" y2="36" stroke="#fdba74" stroke-width="1"/>

      <!-- Section: Sistema -->
      <text x="20" y="56" font-size="10.5" font-weight="bold" fill="#334155">Diretriz de Sistema (System):</text>
      <rect x="20" y="62" width="230" height="32" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>
      <text x="30" y="81" font-size="9.5" font-style="italic" fill="#475569">"Responda estritamente com base nas normas..."</text>

      <!-- Section: Contexto -->
      <text x="20" y="114" font-size="10.5" font-weight="bold" fill="#1e40af">Contexto Institucional (Evidências):</text>
      <rect x="20" y="120" width="230" height="46" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="0.8"/>
      <text x="30" y="137" font-size="9.5" font-style="italic" fill="#1d4ed8">[PPC BSI, Art. 45: O TCC deve ter carga...]</text>
      <text x="30" y="153" font-size="9.5" font-style="italic" fill="#1d4ed8">[Resolução 12: Pré-requisitos de matrícula...]</text>

      <!-- Section: Pergunta -->
      <text x="20" y="186" font-size="10.5" font-weight="bold" fill="#701a75">Pergunta do Discente (User):</text>
      <rect x="20" y="192" width="230" height="32" rx="4" fill="#fdf4ff" stroke="#f5d0fe" stroke-width="0.8"/>
      <text x="30" y="211" font-size="9.5" font-style="italic" fill="#86198f">"Quais os critérios do TCC?"</text>

      <text x="135" y="246" font-size="9.5" font-weight="bold" fill="#c2410c" text-anchor="middle">Prompt Aumentado com Metadados</text>
    </g>
  </g>

  <!-- ================= CONTAINER 3: GERAÇÃO ================= -->
  <g transform="translate(700, 20)">
    <!-- Container Box -->
    <rect x="0" y="0" width="300" height="350" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" stroke-dasharray="5,5" />
    <!-- Header Badge (dentro do tracejado) -->
    <rect x="40" y="12" width="220" height="26" rx="4" fill="#dcfce7" stroke="#bbf7d0" stroke-width="1"/>
    <text x="150" y="29" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle" font-family="sans-serif">3. GERAÇÃO (GENERATION)</text>

    <!-- Node: Modelo de Linguagem -->
    <g transform="translate(20, 50)">
      <rect x="0" y="0" width="260" height="66" rx="6" fill="#ffffff" stroke="#16a34a" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="130" y="24" font-size="12.5" font-weight="bold" fill="#14532d" text-anchor="middle">Modelo de Linguagem (LLM)</text>
      <text x="130" y="42" font-size="10.5" fill="#166534" text-anchor="middle">Inferência Local (Qwen 3.5 4B / Ollama)</text>
      <text x="130" y="56" font-size="9.5" font-style="italic" fill="#15803d" text-anchor="middle">Síntese restrita ao contexto injetado</text>
    </g>

    <!-- Arrow LLM -> Response -->
    <path d="M 150 116 L 150 138" fill="none" stroke="#16a34a" stroke-width="1.8" marker-end="url(#arrow-teal)"/>
    <rect x="110" y="120" width="80" height="16" rx="3" fill="#ffffff" stroke="#bbf7d0" stroke-width="0.8"/>
    <text x="150" y="132" font-size="9" font-weight="bold" fill="#15803d" text-anchor="middle">Geração SSE</text>

    <!-- Node: Resposta Fundamentada com Exemplo Concreto -->
    <g transform="translate(15, 142)">
      <rect x="0" y="0" width="270" height="172" rx="8" fill="#ffffff" stroke="#059669" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="135" y="24" font-size="12.5" font-weight="bold" fill="#065f46" text-anchor="middle">Resposta Fundamentada</text>
      <line x1="20" y1="34" x2="250" y2="34" stroke="#a7f3d0" stroke-width="1"/>

      <!-- Exemplo textual da resposta -->
      <rect x="15" y="42" width="240" height="88" rx="4" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="0.8"/>
      <text x="22" y="60" font-size="9.5" font-style="italic" fill="#065f46">"De acordo com o Art. 45 do PPC de BSI,</text>
      <text x="22" y="76" font-size="9.5" font-style="italic" fill="#065f46">para matricular-se em TCC I o aluno deve</text>
      <text x="22" y="92" font-size="9.5" font-style="italic" fill="#065f46">ter cumprido 100h de atividades e ter</text>
      <text x="22" y="108" font-size="9.5" font-style="italic" fill="#065f46">concluído Metodologia Científica..."</text>
      <text x="22" y="122" font-size="8.5" font-weight="bold" fill="#047857">[Fonte: PPC BSI, Art. 45, p. 52]</text>

      <text x="135" y="152" font-size="9.5" font-weight="bold" fill="#047857" text-anchor="middle">✓ Resposta Factual &amp; Fonte Auditada</text>
    </g>
  </g>

  <!-- ================= TOP LAYER: CONEXÕES ENTRE ESTÁGIOS ================= -->
  <!-- Renderizadas por último para sobrepor qualquer fundo de container -->

  <!-- Connection: Container 1 -> Container 2 -->
  <g transform="translate(320, 178)">
    <path d="M 0 0 L 40 0" fill="none" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrow-blue)"/>
    <rect x="-15" y="-24" width="70" height="18" rx="3" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
    <text x="20" y="-11" font-size="9.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Top-k Chunks</text>
  </g>

  <!-- Connection: Container 2 -> Container 3 -->
  <g transform="translate(660, 178)">
    <path d="M 0 0 L 40 0" fill="none" stroke="#ea580c" stroke-width="2" marker-end="url(#arrow-orange)"/>
    <rect x="-13" y="-24" width="66" height="18" rx="3" fill="#ffffff" stroke="#fed7aa" stroke-width="1"/>
    <text x="20" y="-11" font-size="9.5" font-weight="bold" fill="#c2410c" text-anchor="middle">Prompt Final</text>
  </g>

</svg>
"""

with open("tcc/figuras/pipeline_rag.svg", "w", encoding="utf-8") as f:
    f.write(svg_content.strip())

print("Updated SVG successfully.")
