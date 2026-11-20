import { describe, expect, it } from 'vitest';
import { toProjections } from './entity.mapper.js';
import { toPage } from './pagination.mapper.js';

interface Row {
  id: number;
  name: string;
}

const ROWS: Row[] = [
  { id: 1, name: 'uno' },
  { id: 2, name: 'dos' },
];

describe('mappers de paginación', () => {
  it('[pagination] toProjections transforma cada fila con el mapper de la capacidad', () => {
    const projections = toProjections(ROWS, (row) => ({ id: row.id, label: row.name }));

    expect(projections).toEqual([
      { id: 1, label: 'uno' },
      { id: 2, label: 'dos' },
    ]);
  });

  it('[pagination] toPage compone las filas proyectadas con el total y la ubicación', () => {
    const projections = toProjections(ROWS, (row) => row.name);
    const page = toPage(projections, 42, { page: 2, limit: 2 });

    expect(page).toEqual({ items: ['uno', 'dos'], total: 42, page: 2, limit: 2 });
  });

  it('[pagination] toPage devuelve una copia de las filas', () => {
    const projections = ['uno', 'dos'];
    const page = toPage(projections, 2, { page: 1, limit: 2 });

    expect(page.items).not.toBe(projections);
    expect(page.items).toEqual(projections);
  });
});
