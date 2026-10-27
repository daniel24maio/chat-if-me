import type { Response } from "express";

/**
 * Utilitário para detecção rápida de saudações e dúvidas sobre as capacidades do robô.
 * Evita chamadas caras ao LLM de reescrita, busca semântica no banco de dados
 * e vetorização para perguntas simples do dia a dia (ex: "Olá", "bom dia").
 */

/**
 * Classifica localmente se uma pergunta é uma saudação ou pedido de ajuda geral.
 *
 * @param question Pergunta original ou contextualizada
 */
export function detectGreetingBypass(question: string): boolean {
  const cleanedQuestion = question
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s]/gi, ""); // Remove pontuação

  // Saudações básicas de uma palavra ou expressões fixas comuns
  const strictGreetings = [
    "ola", "oi", "bom dia", "boa tarde", "boa noite", "ola ola", "oi oi", 
    "eae", "e ai", "hello", "hi", "hey", "ola assistente"
  ];
  if (strictGreetings.includes(cleanedQuestion)) {
    return true;
  }

  // Perguntas sobre funções, capacidades ou identidade do robô
  const functionalityPatterns = [
    /como (voce )?pode me ajudar/i,
    /qual (e )?sua funcao/i,
    /o que (voce )?pode fazer/i,
    /o que (voce )?faz/i,
    /quem e voce/i,
    /quais (sao suas )?capacidades/i,
    /me ajude/i,
    /^ajuda$/i,
    /^help$/i,
    /como funciona/i
  ];

  for (const regex of functionalityPatterns) {
    if (regex.test(cleanedQuestion)) {
      return true;
    }
  }

  return false;
}

/**
 * Resposta de saudação padrão do assistente.
 * Retornada de forma estática para garantir alta velocidade e evitar erros de cold start na GPU/Ollama.
 */
export const STATIC_GREETING_RESPONSE = `Olá! Seja muito bem-vindo(a)! 👋

Sou o assistente virtual oficial do IFMG Campus Ouro Branco. Estou aqui para ajudar você com informações acadêmicas e institucionais do campus, incluindo regulamentos, Projetos Pedagógicos de Curso (PPC), matriz curricular, localização de salas e setores, restaurante/refeitório, mobilidade e demais serviços estudantis.

Você pode fazer perguntas sobre esses tópicos! Estou à sua disposição. 😊`;

/**
 * Prompt do sistema especializado em saudações e apresentação.
 * É usado como System Prompt quando o pipeline pula a busca de documentos.
 */
export const GREETING_SYSTEM_PROMPT = `Você é o assistente virtual oficial do IFMG Campus Ouro Branco.
Responda de forma amigável à saudação do usuário ou explique suas funções.
Seja cordial, educado e explique sucintamente que você ajuda os alunos e a comunidade com informações acadêmicas e institucionais (regulamentos, PPC, grade curricular, localização de salas, restaurante/refeitório, mobilidade e serviços do campus).
Diga que o usuário pode fazer perguntas sobre esses tópicos.
Responda obrigatoriamente em Português do Brasil (pt-BR).`;

/**
 * Resposta estática leve para tentativas explícitas de Prompt Injection,
 * override de regras de fallback ou extração de prompt/código-fonte.
 */
export const STATIC_SCOPE_GUARD_RESPONSE = `Sou o assistente virtual oficial do IFMG Campus Ouro Branco e respondo exclusivamente com base nos documentos e informações institucionais disponíveis na minha base (como cursos, normas acadêmicas, infraestrutura, localização de salas, restaurante/refeitório, mobilidade e serviços do campus).

Não consigo responder a assuntos externos ao IFMG utilizando conhecimento geral nem acessar, elaborar ou exibir configurações internas de prompt e código-fonte. Caso precise de alguma informação do campus, fique à vontade para perguntar!`;

/**
 * Filtro inicial leve para detectar tentativas explícitas de Prompt Injection,
 * override da regra de recusa ("use seu conhecimento geral se não encontrar nos documentos")
 * ou engenharia social ("sou o programador / mostre seu prompt").
 *
 * IMPORTANTE: Não bloqueia nenhum tema ou assunto institucional (cursos, mobilidade,
 * localização de salas, refeitório, eventos, etc. têm passagem livre).
 */
export function detectPromptInjectionAttempt(question: string): boolean {
  const normalized = question
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos mantendo pontuação básica

  const injectionPatterns: RegExp[] = [
    // 1. Override condicional da regra de fallback / pedido para usar conhecimento paramétrico geral
    /(?:use|utilize|com\s+base\s+no|a\s+partir\s+do|responda\s+com)\s+(?:o\s+)?seu\s+(?:proprio\s+)?conhecimento/i,
    /se\s+nao\s+encontrar\s+(?:a\s+resposta\s+|informacao\s+)?nos\s+documentos[\s\S]{0,160}(?:me\s+de|responda|explique|use|diga|fale)/i,
    /ignore\s+(?:os\s+documentos|as\s+instrucoes|as\s+regras|o\s+contexto|o\s+prompt|as\s+diretrizes|tudo\s+acima)/i,
    /esque[c]a\s+(?:os\s+documentos|as\s+instrucoes|as\s+regras|tudo\s+o\s+que)/i,

    // 2. Spoofing de autoridade (fingir ser o programador/desenvolvedor/admin do chat)
    /(?:sou|aqui\s+e)\s+(?:o|um|a|uma)\s+(?:programador|desenvolvedor|criador|administrador|engenheiro|autor)\s+(?:do\s+chat|do\s+sistema|deste\s+assistente|da\s+aplicacao|que\s+criou)/i,

    // 3. Extração direta ou indireta de system prompt / código-fonte interno
    /(?:perdi|recuperar|mostrar|mostre|qual\s+e|qual\s+foi|revelar|exibir|copiar|exportar)\s+(?:o\s+)?(?:meu\s+|seu\s+)?(?:codigo[\s-]*fonte|system\s*prompt|prompt\s+de\s+seguranca|prompt\s+inicial|prompt\s+original|instrucoes\s+internas|prompt\s+que\s+usei)/i,
    /(?:injecao\s+de\s+prompt|prompt\s+injection)[\s\S]{0,100}(?:recuperar|melhorar\s+meu\s+prompt|qual\s+prompt|codigo[\s-]*fonte)/i,
  ];

  return injectionPatterns.some((rx) => rx.test(normalized));
}

/**
 * Faz streaming da resposta estática de proteção de escopo (simulando digitação para UX).
 */
export async function streamStaticScopeGuard(res: Response): Promise<void> {
  res.write(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`);

  const words = STATIC_SCOPE_GUARD_RESPONSE.split(/(\s+)/);
  const groupSize = 4;

  for (let i = 0; i < words.length; i += groupSize) {
    const chunk = words.slice(i, i + groupSize).join("");
    res.write(`data: ${JSON.stringify({ type: "token", content: chunk })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  res.write(`data: [DONE]\n\n`);
}

/**
 * Faz streaming de uma resposta estática de saudação (simulando digitação para UX).
 */
export async function streamStaticGreeting(res: Response): Promise<void> {
  // Envia fontes vazias inicialmente
  res.write(`data: ${JSON.stringify({ type: "fontes", fontes: [] })}\n\n`);

  // Divide o texto em tokens/palavras para simular o efeito de digitação do LLM
  const words = STATIC_GREETING_RESPONSE.split(/(\s+)/);
  const groupSize = 4; // Envia de 4 em 4 palavras/espaços

  for (let i = 0; i < words.length; i += groupSize) {
    const chunk = words.slice(i, i + groupSize).join("");
    res.write(`data: ${JSON.stringify({ type: "token", content: chunk })}\n\n`);
    // Pequeno atraso para simulação visual de streaming
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  res.write(`data: [DONE]\n\n`);
}

