import type { Page } from './page.interface.js';

/**
 * Compone una página con las filas ya resueltas. Es el único lugar que arma la
 * forma de la respuesta paginada: lo usan el caso de uso, con las proyecciones,
 * y la implementación del puerto de lectura, con las entidades.
 */
export function toPage<T>(
  items: readonly T[],
  total: number,
  pagination: { page: number; limit: number },
): Page<T> {
  return {
    items: [...items],
    total,
    page: pagination.page,
    limit: pagination.limit,
  };
}
