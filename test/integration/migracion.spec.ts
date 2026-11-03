import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cerrarPostgres, iniciarPostgres, POSTGRES_IMAGE } from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

const TABLAS_ESPERADAS = ['alumno', 'permiso', 'profesor', 'rol', 'rol_permiso', 'usuario'];

async function tablasDeNegocio(entorno: EntornoPostgres): Promise<string[]> {
  const filas = await entorno.orm.em.getConnection().execute<{ tablename: string }[]>(
    `select tablename from pg_tables where schemaname = 'public' and tablename <> 'mikro_orm_migrations' order by tablename;`,
  );

  return filas.map((fila) => fila.tablename);
}

describe(`migración de add-usuario-identity sobre PostgreSQL 18 (${POSTGRES_IMAGE})`, () => {
  let entorno: EntornoPostgres;

  beforeAll(async () => {
    entorno = await iniciarPostgres();
  }, 180_000);

  afterAll(async () => {
    await cerrarPostgres(entorno);
  });

  it('[migracion] aplica y crea las seis tablas sin insertar filas', async () => {
    await entorno.orm.migrator.up();

    expect(await tablasDeNegocio(entorno)).toEqual(TABLAS_ESPERADAS);

    for (const tabla of TABLAS_ESPERADAS) {
      const [fila] = await entorno.orm
        .em!.getConnection()
        .execute<{ total: string }[]>(`select count(*)::text as total from "${tabla}";`);

      expect(fila.total, `la tabla ${tabla} debe quedar vacía`).toBe('0');
    }
  }, 120_000);

  it('[migracion] revierte sin dejar ninguna tabla del cambio', async () => {
    await entorno.orm.migrator.down();

    expect(await tablasDeNegocio(entorno)).toEqual([]);
  }, 60_000);
});
