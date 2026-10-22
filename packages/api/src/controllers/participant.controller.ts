import type { Request, Response } from "express";
import { validateParticipantProfile } from "../constants/profiles.js";
import { saveParticipant } from "../services/participant.service.js";

/**
 * Registra o perfil do participante da pesquisa com UUID v4.
 *
 * Proteção LGPD:
 *  - Jamais aceita ou persiste dados de identificação pessoal (nome, matrícula, etc).
 *  - Extrai somente participantId, profileType, course e coursePhase.
 */
export async function registerParticipant(req: Request, res: Response): Promise<void> {
  try {
    const { participantId, profileType, course, coursePhase } = req.body;

    const validation = validateParticipantProfile({
      participantId,
      profileType,
      course,
      coursePhase,
    });

    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    await saveParticipant({
      participantId,
      profileType,
      course: course || null,
      coursePhase: coursePhase || null,
    });

    res.status(200).json({
      success: true,
      message: "Perfil do participante registrado com sucesso.",
    });
  } catch (error) {
    console.error("[ParticipantController] Erro ao registrar participante:", error);
    res.status(500).json({ error: "Erro interno ao registrar perfil do participante." });
  }
}
