import { raw } from '@mikro-orm/core';
import type { QBFilterQuery } from '@mikro-orm/postgresql';

const COLUMNA = /^[a-z][a-z0-9_]*$/;

/**
 * Condición de búsqueda por coincidencia parcial sobre columnas de texto.
 *
 * La base normaliza los diacríticos y las mayúsculas en la columna y en el
 * patrón (`lower(unaccent(...))`), así que `extension` encuentra `Extensión`.
 * Recibe nombres de columna en snake_case.
 */
export function partialMatch<T>(
  term: string | null | undefined,
  columns: readonly [keyof T & string, ...(keyof T & string)[]],
): QBFilterQuery<T> {
  const texto = term?.trim();

  if (!texto) return {};

  const patron = `%${texto.replace(/[\\%_]/g, '\\$&')}%`;

  return {
    $or: columns.map((columna) => {
      if (!COLUMNA.test(columna)) {
        throw new Error(
          `partialMatch: "${columna}" no es una columna; usá su nombre en snake_case.`,
        );
      }

      return {
        [raw((alias) => `lower(unaccent(${alias}.${columna}))`)]: {
          $like: raw('lower(unaccent(?))', [patron]),
        },
      };
    }),
  } as QBFilterQuery<T>;
}
