import { describe, expect, it } from 'vitest';
import { toPage } from './pagination.mapper.js';

describe('toPage', () => {
  it('[pagination] compone las filas con el total y la ubicación', () => {
    const page = toPage(['uno', 'dos'], 42, { page: 2, limit: 2 });

    expect(page).toEqual({ items: ['uno', 'dos'], total: 42, page: 2, limit: 2 });
  });

  it('[pagination] devuelve una copia de las filas', () => {
    const items = ['uno', 'dos'];
    const page = toPage(items, 2, { page: 1, limit: 2 });

    expect(page.items).not.toBe(items);
    expect(page.items).toEqual(items);
  });
});
