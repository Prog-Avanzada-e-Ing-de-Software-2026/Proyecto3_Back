import { describe, expect, it } from 'vitest';
import { applyPagination } from './pagination-query-builder.js';
import type { PaginableQuery } from './pagination-query-builder.js';

interface Row {
  id: number;
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
  it('[pagination] traduce la página al skip y el limite al take', async () => {
    const query = new FakeQuery([{ id: 11 }, { id: 12 }], 12);

    const page = await applyPagination(query, { page: 3, limit: 5 });

    expect(query.invocation).toEqual({ limit: 5, offset: 10 });
    expect(page).toEqual({
      items: [{ id: 11 }, { id: 12 }],
      total: 12,
      page: 3,
      limit: 5,
    });
  });

  it('[pagination] la primera página no saltea filas', async () => {
    const query = new FakeQuery([{ id: 1 }], 1);

    await applyPagination(query, { page: 1, limit: 10 });

    expect(query.invocation).toEqual({ limit: 10, offset: 0 });
  });
});
