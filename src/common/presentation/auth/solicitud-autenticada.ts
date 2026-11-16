import type { Request } from 'express';

/**
 * Petición con el resultado de la autenticación.
 *
 * `usuario` y `actorId` se describen de forma estructural, sin importar el
 * agregado de `modules/auth`: `common` no puede depender de un módulo, y el
 * guard es quien los completa. `actorId` es el dato que consumen las columnas de
 * auditoría; `usuario` es el que necesita la autorización por permiso.
 */
export interface SolicitudAutenticada extends Request {
  actorId?: number;
  usuario?: {
    id: number;
    permisosEfectivos(): { nombre: string }[];
  };
}
