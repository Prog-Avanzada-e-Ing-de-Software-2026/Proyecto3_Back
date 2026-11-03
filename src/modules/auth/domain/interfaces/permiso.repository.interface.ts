import type { Permiso } from '../entities/permiso.entity.js';

/**
 * Puerto de escritura del catálogo de permisos.
 *
 * La consulta por código es la que hace idempotente la carga inicial: el caso
 * de uso no escribe si la fila ya existe.
 */
export interface IPermisoRepository {
  save(permiso: Permiso): Promise<void>;

  findByCodigo(codigo: string): Promise<Permiso | null>;
}
