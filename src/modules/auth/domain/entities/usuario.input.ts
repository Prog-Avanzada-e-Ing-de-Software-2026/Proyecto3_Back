import type { Rol } from './rol.entity.js';

/**
 * Datos de construcción de un `Usuario`.
 *
 * Es el contrato de entrada de `Usuario.crear`: no valida nada por sí mismo y
 * las invariantes las aplica la raíz del agregado.
 */
export interface CrearUsuario {
  email: string;
  passwordHash: string;
  rol: Rol;
  createdAt: Date;
  createdById?: number | null;
}
