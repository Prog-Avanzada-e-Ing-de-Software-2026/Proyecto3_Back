/**
 * Superficie mínima de una consulta paginable. La cumple el `QueryBuilder` de
 * MikroORM; el tipo evita acoplar el helper a sus genéricos de alias y campos.
 */
export interface PaginableQuery<Entity> {
  limit(limit?: number, offset?: number): PaginableQuery<Entity>;
  getResultAndCount(): Promise<[Entity[], number]>;
}

/**
 * Aplica skip/take a una consulta y devuelve esa misma consulta, con su tipo
 * concreto intacto.
 *
 * `offset` es el único cálculo de la paginación: `(page - 1) * limit`. No
 * ejecuta la consulta ni proyecta filas: eso queda en la implementación del
 * puerto, que ejecuta y arma la página con `toPage`. Conservar el tipo recibido
 * permite seguir encadenando filtros y orden sobre la consulta ya paginada.
 */
export function paginationQueryBuilder<Entity extends object, QB extends PaginableQuery<Entity>>(
  query: QB,
  pagination: { page: number; limit: number },
): QB {
  const offset = (pagination.page - 1) * pagination.limit;

  query.limit(pagination.limit, offset);

  return query;
}
