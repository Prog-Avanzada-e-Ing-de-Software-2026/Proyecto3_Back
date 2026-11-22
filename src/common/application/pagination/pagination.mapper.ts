import type { Page } from './page.interface.js';

/**
 * Compone una página con las filas ya resueltas y el total que cumple el
 * filtro. Es el único lugar que arma la forma de la respuesta paginada: lo usa
 * la implementación del puerto de lectura, con las entidades.
 */
export function toPage<T>(
  items: readonly T[],
  total: number,
  pagination: { page: number; limit: number },
): Page<T> {
  return {
    items: [...items],
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

/**
 * Proyecta las filas de una página conservando su ubicación y su cantidad de
 * páginas. Es la forma de mapear en el caso de uso sin volver a armar el sobre.
 */
export function mapPage<T, Projection>(
  page: Page<T>,
  map: (item: T) => Projection,
): Page<Projection> {
  return {
    items: page.items.map(map),
    page: page.page,
    limit: page.limit,
    totalPages: page.totalPages,
  };
}
