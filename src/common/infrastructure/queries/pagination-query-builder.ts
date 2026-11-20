import { toPage } from '../../application/pagination/pagination.mapper.js';
import type { Page } from '../../application/pagination/page.interface.js';

/**
 * Superficie mínima de una consulta paginable. La cumple el `QueryBuilder` de
 * MikroORM; el tipo evita acoplar el helper a sus genéricos de alias y campos.
 */
export interface PaginableQuery<Entity> {
  limit(limit?: number, offset?: number): PaginableQuery<Entity>;
  getResultAndCount(): Promise<[Entity[], number]>;
}

/**
 * Aplica skip/take a una consulta y devuelve la página ya proyectada.
 *
 * `map` es el mapper de la capacidad: así la entidad no sale de infraestructura
 * y el sobre se arma una sola vez. `offset` es el único cálculo de la
 * paginación: `(page - 1) * limit`. El `count` de `getResultAndCount` ignora
 * límite y desplazamiento, así que el total no queda recortado.
 */
export async function applyPagination<Entity extends object, Projection>(
  query: PaginableQuery<Entity>,
  pagination: { page: number; limit: number },
  map: (entity: Entity) => Projection,
): Promise<Page<Projection>> {
  const offset = (pagination.page - 1) * pagination.limit;
  const [items, total] = await query
    .limit(pagination.limit, offset)
    .getResultAndCount();

  return toPage(items.map(map), total, pagination);
}
