import type { Permiso } from './permiso.entity.js';

/**
 * Datos de construcción de un `Rol`.
 *
 * Es el contrato de entrada de `Rol.crear`: no valida nada por sí mismo y las
 * invariantes las aplica la raíz del agregado. La auditoría del alta la completa
 * el caso de uso.
 */
export interface CrearRol {
  nombre: string;
  descripcion?: string | null;
  permisos?: Permiso[];
}
