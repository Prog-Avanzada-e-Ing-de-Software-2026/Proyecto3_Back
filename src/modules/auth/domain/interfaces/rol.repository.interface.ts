import type { Rol } from '../entities/rol.entity.js';

/**
 * Puerto de persistencia y lectura del catálogo de roles.
 *
 * Devuelve el agregado con su colección de permisos cargada. `existeNombre`
 * ignora el filtro de baja lógica a propósito: el nombre de un rol dado de baja
 * no se libera, así que la unicidad tiene que verlo.
 */
export interface IRolRepository {
  save(rol: Rol): Promise<void>;

  findByNombre(nombre: string): Promise<Rol | null>;

  findById(id: number): Promise<Rol | null>;

  findAll(): Promise<Rol[]>;

  existeNombre(nombre: string, exceptoId?: number): Promise<boolean>;
}
