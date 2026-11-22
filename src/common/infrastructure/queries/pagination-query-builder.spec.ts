import { describe, expect, it } from 'vitest';
import { applyPagination } from './pagination-query-builder.js';
import type { PaginableQuery } from './pagination-query-builder.js';

interface Row {
  id: number;
  name: string;
}

/** Doble de la consulta: registra los argumentos de `limit` y cuenta las ejecuciones. */
class FakeQuery implements PaginableQuery<Row> {
  invocation: { limit?: number; offset?: number } = {};
  ejecuciones = 0;

  constructor(
    private readonly rows: Row[],
    private readonly total: number,
  ) {}

  limit(limit?: number, offset?: number): PaginableQuery<Row> {
    this.invocation = { limit, offset };

    return this;
  }

  getResultAndCount(): Promise<[Row[], number]> {
    this.ejecuciones += 1;

    return Promise.resolve([this.rows, this.total]);
  }
}

describe('applyPagination', () => {
  it('[pagination] traduce la página al skip y el límite al take', () => {
    const query = new FakeQuery([{ id: 11, name: 'once' }], 12);

    applyPagination(query, { page: 3, limit: 5 });

    expect(query.invocation).toEqual({ limit: 5, offset: 10 });
  });

  it('[pagination] la primera página no saltea filas', () => {
    const query = new FakeQuery([{ id: 1, name: 'uno' }], 1);

    applyPagination(query, { page: 1, limit: 10 });

    expect(query.invocation).toEqual({ limit: 10, offset: 0 });
  });

  it('[pagination] devuelve la misma consulta, no un envoltorio', () => {
    const query = new FakeQuery([{ id: 1, name: 'uno' }], 1);

    expect(applyPagination(query, { page: 2, limit: 5 })).toBe(query);
  });

  it('[pagination] no ejecuta la consulta: la ejecuta quien la recibe', async () => {
    const query = new FakeQuery([{ id: 1, name: 'uno' }], 1);

    const paginada = applyPagination(query, { page: 1, limit: 10 });

    expect(query.ejecuciones).toBe(0);

    const [rows, total] = await paginada.getResultAndCount();

    expect(query.ejecuciones).toBe(1);
    expect(rows).toEqual([{ id: 1, name: 'uno' }]);
    expect(total).toBe(1);
  });

  it('[pagination] entrega las filas sin transformarlas', async () => {
    const rows = [{ id: 1, name: 'uno' }];
    const query = new FakeQuery(rows, 1);

    const [items] = await applyPagination(query, { page: 1, limit: 10 }).getResultAndCount();

    expect(items).toBe(rows);
  });
});
