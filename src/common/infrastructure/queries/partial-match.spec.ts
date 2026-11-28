import { describe, expect, it } from 'vitest';
import { partialMatch } from './partial-match.js';

interface Fila {
  nombre: string;
  descripcion: string | null;
}

interface Condicion {
  $or: Record<PropertyKey, { $like: { params: unknown[] } }>[];
}

function condicion(termino: string | null | undefined): Condicion {
  return partialMatch<Fila>(termino, ['nombre']) as unknown as Condicion;
}

function patronDe(condicion: Condicion): unknown {
  const [clave] = Object.getOwnPropertySymbols(condicion.$or[0]);

  return condicion.$or[0][clave].$like.params[0];
}

describe('partialMatch', () => {
  it('[busqueda] un término vacío no agrega condición', () => {
    expect(partialMatch<Fila>(undefined, ['nombre'])).toEqual({});
    expect(partialMatch<Fila>(null, ['nombre'])).toEqual({});
    expect(partialMatch<Fila>('', ['nombre'])).toEqual({});
    expect(partialMatch<Fila>('   ', ['nombre'])).toEqual({});
  });

  it('[busqueda] envuelve el término recortado en comodines', () => {
    expect(patronDe(condicion('  banca  '))).toBe('%banca%');
  });

  it('[busqueda] escapa los comodines del término como literales', () => {
    expect(patronDe(condicion('50%_\\'))).toBe('%50\\%\\_\\\\%');
  });

  it('[busqueda] deja los acentos al unaccent de la base', () => {
    expect(patronDe(condicion('Extensión'))).toBe('%Extensión%');
  });

  it('[busqueda] arma una condición por columna', () => {
    const una = condicion('banca');
    const dos = partialMatch<Fila>('banca', ['nombre', 'descripcion']) as unknown as Condicion;

    expect(una.$or).toHaveLength(1);
    expect(dos.$or).toHaveLength(2);
  });

  it('[busqueda] rechaza un nombre que no es una columna', () => {
    expect(() => partialMatch<Fila>('banca', ['nombreComercial' as unknown as keyof Fila])).toThrow(
      'snake_case',
    );
  });
});
