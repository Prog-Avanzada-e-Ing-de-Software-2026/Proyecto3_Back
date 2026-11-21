/**
 * Superficie mínima de una consulta paginable. La cumple el `QueryBuilder` de
 * MikroORM; el tipo evita acoplar el helper a sus genéricos de alias y campos.
 */
export interface PaginableQuery<Entity> {
  limit(limit?: number, offset?: number): PaginableQuery<Entity>;
  getResultAndCount(): Promise<[Entity[], number]>;
}

/** Consulta ya paginada, lista para que la implementación del puerto la ejecute. */
export interface ExecutableQuery<Entity> {
  getResultAndCount(): Promise<[Entity[], number]>;
}

/**
 * Aplica skip/take a una consulta y devuelve su ejecutor.
 *
 * `offset` es el único cálculo de la paginación: `(page - 1) * limit`. No
 * ejecuta la consulta ni proyecta filas: eso queda en la implementación del
 * puerto, que ejecuta y arma la página con `toPage`. El tipo devuelto oculta el
 * resto del `QueryBuilder` para que nadie vuelva a paginar una consulta ya
 * paginada.
 */
export function applyPagination<Entity extends object>(
  query: PaginableQuery<Entity>,
  pagination: { page: number; limit: number },
): ExecutableQuery<Entity> {
  const offset = (pagination.page - 1) * pagination.limit;
  const paginada = query.limit(pagination.limit, offset);

  return { getResultAndCount: () => paginada.getResultAndCount() };
}
