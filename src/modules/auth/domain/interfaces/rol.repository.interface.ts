import type { Rol } from '../entities/rol.entity.js';

/** Puerto de persistencia y lectura del catálogo de roles. */
export interface IRolRepository {
  save(rol: Rol): Promise<void>;

  /** Devuelve el agregado con su colección de permisos cargada. */
  findByNombre(nombre: string): Promise<Rol | null>;

  findById(id: number): Promise<Rol | null>;

  findAll(): Promise<Rol[]>;

  /**
   * Ignora el filtro de baja lógica: el nombre de un rol dado de baja no se
   * libera, así que la unicidad tiene que verlo.
   */
  existeNombre(nombre: string, exceptoId?: number): Promise<boolean>;
}
