import type { Rol } from './rol.entity.js';

/**
 * Datos de construcción de un `Usuario`.
 *
 * Es el contrato de entrada de `Usuario.crear`: no valida nada por sí mismo y
 * las invariantes las aplica la raíz del agregado. La auditoría del alta la
 * completa el caso de uso.
 */
export interface CrearUsuario {
  email: string;
  passwordHash: string;
  rol: Rol;
}
