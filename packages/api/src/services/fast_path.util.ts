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
 * Prompt do sistema especializado em saudações e apresentação.
 * É usado como System Prompt quando o pipeline pula a busca de documentos.
 */
export const GREETING_SYSTEM_PROMPT = `Você é o assistente virtual oficial do IFMG Campus Ouro Branco.
Responda de forma amigável à saudação do usuário ou explique suas funções.
Seja cordial, educado e explique sucintamente que você ajuda os alunos com informações acadêmicas, regulamentos do curso, Projeto Pedagógico do Curso (PPC), grade curricular e normas do campus.
Diga que o usuário pode fazer perguntas sobre esses tópicos.
Responda obrigatoriamente em Português do Brasil (pt-BR).`;
