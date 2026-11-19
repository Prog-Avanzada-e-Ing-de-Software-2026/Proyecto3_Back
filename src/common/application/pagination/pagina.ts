/**
 * Página de una lectura paginada.
 *
 * `total` cuenta todos los elementos que cumplen el filtro, no solo los de la
 * página, para que el cliente pueda recorrer el resto. `skip` y `take` repiten la
 * ventana pedida, ya con los valores por defecto resueltos.
 */
export interface Pagina<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}
