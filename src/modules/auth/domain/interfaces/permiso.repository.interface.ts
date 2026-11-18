import type { Permiso } from '../entities/permiso.entity.js';

/** Puerto de persistencia y lectura del catálogo de permisos. */
export interface IPermisoRepository {
  save(permiso: Permiso): Promise<void>;

  findByNombre(nombre: string): Promise<Permiso | null>;

  findById(id: number): Promise<Permiso | null>;

  findAll(): Promise<Permiso[]>;

  /**
   * Ignora el filtro de baja lógica: el nombre de un permiso dado de baja no se
   * libera, así que la unicidad tiene que verlo.
   */
  existeNombre(nombre: string, exceptoId?: number): Promise<boolean>;
}
