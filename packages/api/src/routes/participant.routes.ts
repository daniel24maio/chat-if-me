import { Router } from "express";
import { registerParticipant } from "../controllers/participant.controller.js";

export const participantRouter = Router();

/**
 * POST /api/participants
 * Registra o vínculo / perfil anônimo do participante.
 */
participantRouter.post("/", registerParticipant);
