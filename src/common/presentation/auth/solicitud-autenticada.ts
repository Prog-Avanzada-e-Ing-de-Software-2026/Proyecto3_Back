import type { Request } from 'express';

/**
 * Petición con el actor ya resuelto por el guard de autenticación.
 *
 * Solo transporta el identificador: el actor de auditoría es un número, y la
 * operación que necesite el agregado completo lo recupera por su puerto.
 */
export interface SolicitudAutenticada extends Request {
  actorId?: number;
}
