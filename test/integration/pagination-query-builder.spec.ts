import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyPagination } from '../../src/common/infrastructure/queries/pagination-query-builder.js';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { cerrarPostgres, iniciarPostgres, vaciarTablas } from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

let entorno: EntornoPostgres;

const CANTIDAD = 12;

/** Consulta ordenada sobre el catálogo de permisos, la víctima de la paginación. */
function query() {
  return entorno.orm.em
    .fork()
    .createQueryBuilder(Permiso, 'p')
    .select('*')
    .where({ deletedAt: null })
    .orderBy({ nombre: 'asc' });
}

function nombre(indice: number): string {
  return `permiso:${String(indice).padStart(2, '0')}`;
}

async function sembrar(): Promise<void> {
  const em = entorno.orm.em.fork();
  const permisos = Array.from({ length: CANTIDAD }, (_, indice) => {
    const permiso = Permiso.crear({ nombre: nombre(indice) });
    permiso.createdAt = new Date('2026-01-01T10:00:00.000Z');

    return permiso;
  });

  em.persist(permisos);
  await em.flush();
}

beforeAll(async () => {
  entorno = await iniciarPostgres();
  await entorno.orm.migrator.up();
}, 180_000);

beforeEach(async () => {
  await vaciarTablas(entorno.orm);
});

afterAll(async () => {
  await cerrarPostgres(entorno);
});

describe('applyPagination', () => {
  it('[pagination] devuelve la primera página con el total completo', async () => {
    await sembrar();

    const [items, total] = await applyPagination(query(), { page: 1, limit: 5 }).getResultAndCount();

    expect(items.map((permiso) => permiso.nombre)).toEqual([
      nombre(0),
      nombre(1),
      nombre(2),
      nombre(3),
      nombre(4),
    ]);
    expect(total).toBe(CANTIDAD);
  });

  it('[pagination] el offset saltea las filas de las páginas anteriores', async () => {
    await sembrar();

    const [items, total] = await applyPagination(query(), { page: 2, limit: 5 }).getResultAndCount();

    expect(items.map((permiso) => permiso.nombre)).toEqual([
      nombre(5),
      nombre(6),
      nombre(7),
      nombre(8),
      nombre(9),
    ]);
    expect(total).toBe(CANTIDAD);
  });

  it('[pagination] la última página trae solo las filas restantes', async () => {
    await sembrar();

    const [items, total] = await applyPagination(query(), { page: 3, limit: 5 }).getResultAndCount();

    expect(items.map((permiso) => permiso.nombre)).toEqual([nombre(10), nombre(11)]);
    expect(total).toBe(CANTIDAD);
  });

  it('[pagination] conserva el query builder para seguir filtrando después de paginar', async () => {
    await sembrar();

    const [items, total] = await applyPagination(query(), { page: 1, limit: 5 })
      .andWhere({ nombre: { $gte: nombre(6) } })
      .getResultAndCount();

    expect(items.map((permiso) => permiso.nombre)).toEqual([
      nombre(6),
      nombre(7),
      nombre(8),
      nombre(9),
      nombre(10),
    ]);
    expect(total).toBe(6);
  });

  it('[pagination] una página fuera de rango no trae filas y conserva el total', async () => {
    await sembrar();

    const [items, total] = await applyPagination(query(), { page: 4, limit: 5 }).getResultAndCount();

    expect(items).toEqual([]);
    expect(total).toBe(CANTIDAD);
  });
});
