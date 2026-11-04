import type { Rol } from '../entities/rol.entity.js';

/**
 * Puerto de escritura del catálogo de roles.
 *
 * Devuelve el agregado con su colección de permisos cargada, y la consulta por
 * nombre es la que hace idempotente la carga inicial.
 */
export interface IRolRepository {
  save(rol: Rol): Promise<void>;

  findByNombre(nombre: string): Promise<Rol | null>;
}
