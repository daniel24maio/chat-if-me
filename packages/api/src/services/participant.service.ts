import { pool } from "../config/database.js";
import { type ProfileType, type CourseType, type CoursePhaseType } from "../constants/profiles.js";

export interface ParticipantData {
  participantId: string;
  profileType: ProfileType;
  course?: CourseType | null;
  coursePhase?: CoursePhaseType | null;
}

/**
 * Salva ou atualiza os metadados demográficos anônimos do participante.
 * Operação idempotente via ON CONFLICT.
 */
export async function saveParticipant(data: ParticipantData): Promise<void> {
  const { participantId, profileType, course = null, coursePhase = null } = data;

  await pool.query(
    `INSERT INTO chat_participants (participant_id, profile_type, course, course_phase)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (participant_id) DO UPDATE
     SET profile_type = EXCLUDED.profile_type,
         course = EXCLUDED.course,
         course_phase = EXCLUDED.course_phase`,
    [participantId, profileType, course, coursePhase]
  );

  console.log(`👤 [Participante] Registro anônimo salvo: ${participantId.substring(0, 8)}... (${profileType}${course ? ` - ${course}` : ""}${coursePhase ? ` [${coursePhase}]` : ""})`);
}

/**
 * Busca um participante pelo ID.
 */
export async function getParticipantById(participantId: string) {
  const result = await pool.query(
    `SELECT participant_id, profile_type, course, course_phase, created_at
     FROM chat_participants
     WHERE participant_id = $1`,
    [participantId]
  );

  return result.rows[0] || null;
}
