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
 * Aplica skip/take a una consulta y devuelve la página junto al total de filas
 * que cumplen el filtro.
 *
 * `offset` es el único cálculo de la paginación: `(page - 1) * limit`. El
 * `count` de `getResultAndCount` ignora límite y desplazamiento, así que el
 * total no queda recortado. Lo usa la implementación del puerto de lectura: el
 * `QueryBuilder` nunca cruza hacia `application/`.
 */
export async function applyPagination<Entity extends object>(
  query: PaginableQuery<Entity>,
  pagination: { page: number; limit: number },
): Promise<Page<Entity>> {
  const offset = (pagination.page - 1) * pagination.limit;
  const [items, total] = await query
    .limit(pagination.limit, offset)
    .getResultAndCount();

  return toPage(items, total, pagination);
}
