# Chat Assistente Virtual IFMG — Frontend Web 🎓💻

**Interface Web responsiva e dinâmica do assistente virtual acadêmico do IFMG Campus Ouro Branco.**

Este pacote contém o frontend da aplicação, desenvolvido com React, Vite e Tailwind CSS, oferecendo uma experiência moderna de chat em tempo real com streaming de respostas (SSE) e uma área de administração para ingestão e controle de documentos.

---

## 🎨 Funcionalidades e Design

*   **Identidade Visual IFMG**: Cores institucionais personalizadas (Verde `#2F9E41` / Vermelho `#CD191E`).
*   **Modo Escuro (Dark Mode)**: Suporte completo a temas claro/escuro com transições suaves, respeitando as preferências do sistema ou do usuário.
*   **Streaming SSE**: Exibição de tokens em tempo real com indicador de escrita (cursor piscante `█`) e carregamento dinâmico.
*   **Status Dinâmicos do Pipeline**: Exibe na bolha de digitação o progresso real do backend ("Analisando pergunta...", "Buscando nos documentos...", "Preparando resposta...") em tempo real.
*   **Memória de Sessão em RAM**: Diálogos multi-turn integrados com resolução de pronomes e persistência conversacional.
*   **Modal de Expiração por Inatividade**: Ao atingir 5 minutos de inatividade, o chat bloqueia a digitação (campo de texto e botão de envio) e exibe um modal overlay (com desfoque de fundo e animação suave) para iniciar uma "Nova Conversa" de forma segura.
*   **Botões de Feedback**: Adição de botões 👍/👎 para coletar feedback sobre as respostas da IA (ocultados na mensagem inicial de boas-vindas e em avisos do sistema).
*   **Ocultação Condicional de Fontes**: Em modo RAG clássico, as fontes de documentos são ocultadas da interface para manter o visual limpo, mas são logadas no console do navegador. São visíveis na UI apenas no modo Agente MCP.
*   **Acessibilidade (Diretrizes WCAG)**: Contraste de cores otimizado para o tema escuro (mínimo de 4.5:1 em textos muted), anéis de foco (`focus-visible`) visíveis em todos os botões e inputs para navegação fluida por teclado, tags `aria-live="polite"` e `aria-atomic="false"` na bolha de streaming, e `aria-label` descritivos nos botões 👍/👎 e campos interativos.
*   **Otimização Mobile e Tipografia**: Alinhamento à esquerda forçado (`text-align: left`) em todas as bolhas para melhor escaneabilidade sem texto justificado. Aplainamento visual de listas em Markdown para evitar recuos profundos e quebras de layout em telas de smartphones. Inclusão de data (`dd/mm/aaaa hh:mm`) no rodapé dos timestamps.
*   **Painel Administrativo (`/embedding`)**:
    *   Drag-and-drop de arquivos para envio à API.
    *   Feedback visual do status de processamento por documento.
    *   Listagem de documentos processados na base de conhecimento com opção de exclusão definitiva.
*   **Responsividade**: Otimizado para telas de dispositivos móveis, tablets e computadores.

---

## 🛠️ Tecnologias Utilizadas

*   **React 19** como biblioteca de UI.
*   **Vite 8** para build e desenvolvimento extremamente rápidos.
*   **Tailwind CSS 4** para estilização utilitária e responsiva.
*   **React Router DOM** para controle de rotas internas.
*   **React Markdown** + **Remark GFM** para renderização elegante de formatação enriquecida (tabelas, listas, negritos, etc.).
*   **Lucide React** para um conjunto moderno de ícones vetoriais.

---

## ⚙️ Configuração (Variáveis de Ambiente)

Crie um arquivo `.env` a partir do template `.env.example`:

```env
# URL da API Backend
VITE_API_URL=http://localhost:3333
```

---

## 🚀 Como Executar

### Desenvolvimento

Para iniciar o servidor de desenvolvimento com Hot Module Replacement (HMR):

```bash
# A partir da raiz do monorepo:
npm run dev:web

# Ou diretamente dentro da pasta packages/web:
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Construção para Produção

Para compilar e otimizar os arquivos estáticos de produção:

```bash
# Dentro da pasta packages/web:
npm run build
```

Os arquivos de produção serão gerados no diretório `dist/`, prontos para serem servidos por um servidor web como o Nginx.
