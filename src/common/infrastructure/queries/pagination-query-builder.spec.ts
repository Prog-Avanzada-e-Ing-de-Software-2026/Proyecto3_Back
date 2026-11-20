import { describe, expect, it } from 'vitest';
import { applyPagination } from './pagination-query-builder.js';
import type { PaginableQuery } from './pagination-query-builder.js';

interface Row {
  id: number;
  name: string;
}

/** Doble de la consulta: registra los argumentos de `limit` y devuelve una página fija. */
class FakeQuery implements PaginableQuery<Row> {
  invocation: { limit?: number; offset?: number } = {};

  constructor(
    private readonly rows: Row[],
    private readonly total: number,
  ) {}

  limit(limit?: number, offset?: number): PaginableQuery<Row> {
    this.invocation = { limit, offset };

    return this;
  }

  getResultAndCount(): Promise<[Row[], number]> {
    return Promise.resolve([this.rows, this.total]);
  }
}

describe('applyPagination', () => {
  it('[pagination] traduce la página al skip y el límite al take', async () => {
    const query = new FakeQuery(
      [
        { id: 11, name: 'once' },
        { id: 12, name: 'doce' },
      ],
      12,
    );

    const page = await applyPagination(query, { page: 3, limit: 5 }, (row) => row.name);

    expect(query.invocation).toEqual({ limit: 5, offset: 10 });
    expect(page).toEqual({ items: ['once', 'doce'], total: 12, page: 3, limit: 5 });
  });

  it('[pagination] la primera página no saltea filas', async () => {
    const query = new FakeQuery([{ id: 1, name: 'uno' }], 1);

    await applyPagination(query, { page: 1, limit: 10 }, (row) => row.id);

    expect(query.invocation).toEqual({ limit: 10, offset: 0 });
  });

  it('[pagination] proyecta cada fila con el mapper de la capacidad', async () => {
    const query = new FakeQuery([{ id: 1, name: 'uno' }], 1);

    const page = await applyPagination(query, { page: 1, limit: 10 }, (row) => ({
      identificador: row.id,
    }));

    expect(page.items).toEqual([{ identificador: 1 }]);
  });
});
