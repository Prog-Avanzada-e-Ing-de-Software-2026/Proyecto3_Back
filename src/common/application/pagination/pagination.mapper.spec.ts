import { describe, expect, it } from 'vitest';
import { mapPage, toPage } from './pagination.mapper.js';
import type { Page } from './page.interface.js';

describe('toPage', () => {
  it('[pagination] compone las filas con la ubicación y la cantidad de páginas', () => {
    const page = toPage(['uno', 'dos'], 42, { page: 2, limit: 2 });

    expect(page).toEqual({ items: ['uno', 'dos'], page: 2, limit: 2, totalPages: 21 });
  });

  it('[pagination] no expone el total de filas, solo la cantidad de páginas', () => {
    const page = toPage(['uno'], 42, { page: 1, limit: 10 });

    expect(page).not.toHaveProperty('total');
    expect(page.totalPages).toBe(5);
  });

  it('[pagination] redondea hacia arriba cuando el total no es múltiplo del límite', () => {
    const page = toPage(['uno'], 11, { page: 1, limit: 5 });

    expect(page.totalPages).toBe(3);
  });

  it('[pagination] sin filas no hay páginas', () => {
    const page = toPage([], 0, { page: 1, limit: 10 });

    expect(page.totalPages).toBe(0);
  });

  it('[pagination] devuelve una copia de las filas', () => {
    const items = ['uno', 'dos'];
    const page = toPage(items, 2, { page: 1, limit: 2 });

    expect(page.items).not.toBe(items);
    expect(page.items).toEqual(items);
  });
});

describe('mapPage', () => {
  const page: Page<{ id: number; nombre: string }> = {
    items: [
      { id: 1, nombre: 'uno' },
      { id: 2, nombre: 'dos' },
    ],
    page: 2,
    limit: 2,
    totalPages: 3,
  };

  it('[pagination] proyecta las filas y conserva la ubicación y la cantidad de páginas', () => {
    const mapped = mapPage(page, (item) => ({ identificador: item.id }));

    expect(mapped).toEqual({
      items: [{ identificador: 1 }, { identificador: 2 }],
      page: 2,
      limit: 2,
      totalPages: 3,
    });
  });

  it('[pagination] no muta la página original', () => {
    mapPage(page, (item) => item.nombre);

    expect(page.items).toEqual([
      { id: 1, nombre: 'uno' },
      { id: 2, nombre: 'dos' },
    ]);
  });
});
