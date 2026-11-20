/**
 * Página de resultados de una lectura: las filas, el total que cumple el filtro
 * y los parámetros con los que se pidió.
 *
 * Es lo que devuelve el puerto de lectura y también lo que el caso de uso
 * entrega al transporte, con las filas ya proyectadas.
 */
export interface Page<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
