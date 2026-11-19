import type { Request } from 'express';

/**
 * Petición con el resultado de la autenticación.
 *
 * `usuario` se describe de forma estructural, sin importar el agregado de
 * `modules/auth`: `common` no puede depender de un módulo, y el guard es quien lo
 * completa. Es el dato que consumen la auditoría y la autorización por permiso.
 */
export interface SolicitudAutenticada extends Request {
  usuario?: {
    id: number;
    permisosEfectivos(): { nombre: string }[];
  };
}
