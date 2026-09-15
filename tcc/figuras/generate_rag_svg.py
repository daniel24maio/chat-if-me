import os
import subprocess
import shutil

# Layout: Linha 1 com Recuperação e Enriquecimento lado a lado (simétricos);
# Linha 2 com Geração ocupando a largura total inferior com fluxo LLM -> Resposta.
# Dimensões 840x690 para máxima legibilidade e encaixe perfeito no template SBC.
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 690" width="100%" height="100%" style="background-color: #ffffff; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1d4ed8" />
    </marker>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ea580c" />
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#16a34a" />
    </marker>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4b5563" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.07"/>
    </filter>
  </defs>

  <!-- ================= CONTAINER 1: RECUPERAÇÃO ================= -->
  <g transform="translate(20, 20)">
    <!-- Container Box -->
    <rect x="0" y="0" width="365" height="370" rx="8" fill="#f8fafc" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="6,6" />
    <!-- Header Badge -->
    <rect x="52" y="12" width="260" height="28" rx="5" fill="#dbeafe" stroke="#bfdbfe" stroke-width="1"/>
    <text x="182.5" y="31" font-size="13.5" font-weight="bold" fill="#1e40af" text-anchor="middle">1. RECUPERAÇÃO (RETRIEVAL)</text>

    <!-- Node: Consulta do Discente -->
    <g transform="translate(18, 50)">
      <rect x="0" y="0" width="329" height="54" rx="6" fill="#ffffff" stroke="#64748b" stroke-width="1.2" filter="url(#shadow)"/>
      <text x="164.5" y="22" font-size="13.5" font-weight="bold" fill="#1e293b" text-anchor="middle">Consulta do Discente</text>
      <text x="164.5" y="41" font-size="12.5" font-style="italic" fill="#475569" text-anchor="middle">"Quais os critérios do TCC?"</text>
    </g>

    <!-- Seta Query -> Search -->
    <path d="M 182.5 104 L 182.5 124" fill="none" stroke="#4b5563" stroke-width="1.5" marker-end="url(#arrow-gray)"/>

    <!-- Node: Busca Híbrida RRF -->
    <g transform="translate(18, 126)">
      <rect x="0" y="0" width="329" height="80" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="164.5" y="24" font-size="14" font-weight="bold" fill="#1e40af" text-anchor="middle">Busca Híbrida RRF</text>
      <text x="164.5" y="45" font-size="12" fill="#2563eb" text-anchor="middle">Vetorial Densa (HNSW) + Léxica (FTS)</text>
      <text x="164.5" y="65" font-size="12" font-weight="bold" fill="#1d4ed8" text-anchor="middle">Fusão por Rank Recíproco (RRF Ponderado)</text>
    </g>

    <!-- Setas Duplas: Busca <-> Base -->
    <path d="M 120 206 L 120 262" fill="none" stroke="#1d4ed8" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
    <text x="110" y="238" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="end">Consulta</text>

    <path d="M 245 262 L 245 206" fill="none" stroke="#1d4ed8" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
    <text x="255" y="238" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="start">Fragmentos</text>

    <!-- Node: Base de Conhecimento -->
    <g transform="translate(18, 264)">
      <rect x="0" y="0" width="329" height="84" rx="6" fill="#ffffff" stroke="#3b82f6" stroke-width="1.2" filter="url(#shadow)"/>
      <text x="164.5" y="25" font-size="14" font-weight="bold" fill="#1e3a8a" text-anchor="middle">Base de Conhecimento Auditada</text>
      <text x="164.5" y="47" font-size="12" fill="#475569" text-anchor="middle">Regulamentos e PPCs Oficiais Sanitizados</text>
      <text x="164.5" y="68" font-size="11.5" fill="#64748b" text-anchor="middle">Tabelas Vetoriais (PostgreSQL + pgvector)</text>
    </g>
  </g>

  <!-- ================= CONTAINER 2: ENRIQUECIMENTO ================= -->
  <g transform="translate(455, 20)">
    <!-- Container Box -->
    <rect x="0" y="0" width="365" height="370" rx="8" fill="#fffdfa" stroke="#fed7aa" stroke-width="1.5" stroke-dasharray="6,6" />
    <!-- Header Badge -->
    <rect x="40" y="12" width="285" height="28" rx="5" fill="#ffedd5" stroke="#fed7aa" stroke-width="1"/>
    <text x="182.5" y="31" font-size="13.5" font-weight="bold" fill="#c2410c" text-anchor="middle">2. ENRIQUECIMENTO (AUGMENTATION)</text>

    <!-- Card: Montagem do Prompt Estruturado -->
    <g transform="translate(18, 50)">
      <rect x="0" y="0" width="329" height="300" rx="8" fill="#ffffff" stroke="#ea580c" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="164.5" y="24" font-size="14" font-weight="bold" fill="#9a3412" text-anchor="middle">Montagem do Prompt Estruturado</text>
      <line x1="18" y1="32" x2="311" y2="32" stroke="#fdba74" stroke-width="1"/>

      <!-- Seção: Diretriz de Sistema -->
      <text x="18" y="51" font-size="12" font-weight="bold" fill="#334155">Diretriz de Sistema (System Prompt):</text>
      <rect x="18" y="57" width="293" height="32" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>
      <text x="26" y="77" font-size="11.5" font-style="italic" fill="#475569">"Responda estritamente com base nas normas..."</text>

      <!-- Seção: Contexto Institucional -->
      <text x="18" y="108" font-size="12" font-weight="bold" fill="#1e40af">Contexto Institucional (Evidências Top-k):</text>
      <rect x="18" y="114" width="293" height="52" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="0.8"/>
      <text x="26" y="133" font-size="11" font-style="italic" fill="#1d4ed8">[PPC BSI, Art. 45: O TCC deve ter carga...]</text>
      <text x="26" y="152" font-size="11" font-style="italic" fill="#1d4ed8">[Resolução 12: Pré-requisitos de matrícula...]</text>

      <!-- Seção: Pergunta do Discente -->
      <text x="18" y="185" font-size="12" font-weight="bold" fill="#701a75">Pergunta do Discente (User Prompt):</text>
      <rect x="18" y="191" width="293" height="32" rx="4" fill="#fdf4ff" stroke="#f5d0fe" stroke-width="0.8"/>
      <text x="26" y="211" font-size="11.5" font-style="italic" fill="#86198f">"Quais os critérios do TCC?"</text>

      <!-- Footer do Card -->
      <rect x="35" y="246" width="259" height="28" rx="4" fill="#fff7ed" stroke="#fed7aa" stroke-width="1"/>
      <text x="164.5" y="264" font-size="12" font-weight="bold" fill="#c2410c" text-anchor="middle">✓ Prompt Aumentado com Metadados</text>
    </g>
  </g>

  <!-- ================= CONTAINER 3: GERAÇÃO ================= -->
  <g transform="translate(20, 455)">
    <!-- Container Box -->
    <rect x="0" y="0" width="800" height="215" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" stroke-dasharray="6,6" />
    <!-- Header Badge -->
    <rect x="275" y="12" width="250" height="28" rx="5" fill="#dcfce7" stroke="#bbf7d0" stroke-width="1"/>
    <text x="400" y="31" font-size="13.5" font-weight="bold" fill="#15803d" text-anchor="middle">3. GERAÇÃO (GENERATION)</text>

    <!-- Node: Modelo de Linguagem (LLM) -->
    <g transform="translate(18, 50)">
      <rect x="0" y="0" width="340" height="148" rx="8" fill="#ffffff" stroke="#16a34a" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="170" y="24" font-size="14" font-weight="bold" fill="#14532d" text-anchor="middle">Modelo de Linguagem (LLM)</text>
      
      <rect x="20" y="33" width="300" height="25" rx="4" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="0.8"/>
      <text x="170" y="49" font-size="12" font-weight="bold" fill="#166534" text-anchor="middle">Qwen 3.5 4B (Inferência Local via Ollama)</text>

      <text x="170" y="78" font-size="12" font-style="italic" fill="#15803d" text-anchor="middle">Síntese estritamente restrita ao contexto</text>
      <text x="170" y="99" font-size="11.5" fill="#166534" text-anchor="middle">Ancoragem factual contra alucinações</text>

      <rect x="30" y="112" width="280" height="24" rx="4" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="0.8"/>
      <text x="170" y="128" font-size="11.5" font-weight="bold" fill="#047857" text-anchor="middle">🔒 Soberania de Dados e Baixa Latência</text>
    </g>

    <!-- Conexão LLM -> Resposta (Geração SSE) -->
    <g transform="translate(360, 124)">
      <path d="M 0 0 L 58 0" fill="none" stroke="#16a34a" stroke-width="2" marker-end="url(#arrow-green)"/>
      <rect x="0" y="-22" width="60" height="18" rx="3" fill="#ffffff" stroke="#86efac" stroke-width="1"/>
      <text x="30" y="-9" font-size="10.5" font-weight="bold" fill="#15803d" text-anchor="middle">Geração SSE</text>
      <text x="30" y="15" font-size="10" fill="#166534" text-anchor="middle">(Streaming)</text>
    </g>

    <!-- Node: Resposta Fundamentada & Auditada -->
    <g transform="translate(422, 50)">
      <rect x="0" y="0" width="360" height="148" rx="8" fill="#ffffff" stroke="#059669" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="180" y="24" font-size="14" font-weight="bold" fill="#065f46" text-anchor="middle">Resposta Fundamentada &amp; Auditada</text>

      <!-- Exemplo textual da resposta com citação -->
      <rect x="16" y="33" width="328" height="82" rx="5" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="0.8"/>
      <text x="24" y="52" font-size="11.5" font-style="italic" fill="#065f46">"De acordo com o Art. 45 do PPC de BSI, para"</text>
      <text x="24" y="69" font-size="11.5" font-style="italic" fill="#065f46">"matricular-se em TCC I o aluno deve ter cumprido"</text>
      <text x="24" y="86" font-size="11.5" font-style="italic" fill="#065f46">"100h de atividades e Metodologia Científica..."</text>
      <text x="24" y="103" font-size="11" font-weight="bold" fill="#047857">[Fonte: PPC BSI, Art. 45, p. 52]</text>

      <text x="180" y="133" font-size="12" font-weight="bold" fill="#047857" text-anchor="middle">✓ Resposta Factual com Citação Direta</text>
    </g>
  </g>

  <!-- ================= TOP LAYER: CONEXÕES ENTRE ESTÁGIOS ================= -->
  <!-- Renderizadas por último para sobrepor qualquer fundo de container sem cortes -->

  <!-- Conexão 1 -> 2: Top-k Chunks (no vão de 70px entre os containers) -->
  <g transform="translate(385, 166)">
    <path d="M 0 0 L 68 0" fill="none" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrow-blue)"/>
    <rect x="-8" y="-23" width="86" height="20" rx="4" fill="#ffffff" stroke="#93c5fd" stroke-width="1.2" filter="url(#shadow)"/>
    <text x="35" y="-9" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">Top-k Chunks</text>
  </g>

  <!-- Conexão 2 -> 3: Prompt Aumentado (trilha suave no corredor intermediário) -->
  <g>
    <!-- Sai do centro da base do Card 2 (x=637.5, y=390), desce até y=422, corre à esquerda até x=208, desce para o Card 3 (LLM) em y=453 -->
    <path d="M 637.5 390 L 637.5 414 Q 637.5 422 627.5 422 L 218 422 Q 208 422 208 432 L 208 453" fill="none" stroke="#ea580c" stroke-width="2" marker-end="url(#arrow-orange)"/>
    
    <!-- Badge do Prompt no centro do corredor -->
    <rect x="280" y="409" width="280" height="26" rx="5" fill="#ffffff" stroke="#fdba74" stroke-width="1.2" filter="url(#shadow)"/>
    <text x="420" y="426.5" font-size="12" font-weight="bold" fill="#c2410c" text-anchor="middle">Prompt Aumentado (Contexto + Pergunta)</text>
  </g>

</svg>
"""

base_dir = os.path.dirname(os.path.abspath(__file__))
svg_path = os.path.join(base_dir, "pipeline_rag.svg")
pdf_path = os.path.join(base_dir, "pipeline_rag.pdf")
png_path = os.path.join(base_dir, "pipeline_rag.png")
fluxo_rag_png = os.path.join(base_dir, "..", "figura-1-(fluxo-RAG).png")
html_path = os.path.join(base_dir, "pipeline_rag_temp.html")

with open(svg_path, "w", encoding="utf-8") as f:
    f.write(svg_content.strip())
print(f"SVG salvo com sucesso: {svg_path}")

# Conversão automática para PDF vetorial e PNG de alta resolução com bounding box exata
html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: 840px 690px;
    margin: 0;
  }}
  * {{ box-sizing: border-box; }}
  html, body {{
    margin: 0; padding: 0;
    width: 840px; height: 690px;
    overflow: hidden; background-color: #ffffff;
  }}
  svg {{ display: block; width: 840px; height: 690px; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if os.path.exists(edge_path):
    # Gerar PDF vetorial
    cmd_pdf = [
        edge_path,
        "--headless=new",
        f"--print-to-pdf={pdf_path}",
        "--no-pdf-header-footer",
        html_path
    ]
    subprocess.run(cmd_pdf, capture_output=True, text=True)
    if os.path.exists(pdf_path):
        print(f"PDF vetorial gerado com sucesso: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")

    # Gerar PNG em alta resolução (renderização do browser)
    cmd_png = [
        edge_path,
        "--headless=new",
        f"--screenshot={png_path}",
        "--window-size=840,690",
        "--hide-scrollbars",
        html_path
    ]
    subprocess.run(cmd_png, capture_output=True, text=True)
    if os.path.exists(png_path):
        print(f"PNG gerado com sucesso: {png_path} ({os.path.getsize(png_path)} bytes)")
        shutil.copy2(png_path, fluxo_rag_png)
        print(f"PNG sincronizado em: {fluxo_rag_png}")

if os.path.exists(html_path):
    os.remove(html_path)


