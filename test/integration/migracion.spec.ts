import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cerrarPostgres, iniciarPostgres, POSTGRES_IMAGE } from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

const TABLAS_ESPERADAS = [
  'alumno',
  'categoria_ejercicio',
  'dia_del_plan',
  'ejercicio',
  'ejercicio_planificado',
  'ejercicio_realizado',
  'entrenamiento',
  'material',
  'objetivo_plan',
  'permiso',
  'plan',
  'prescripcion_semanal',
  'profesor',
  'rol',
  'rol_permiso',
  'serie',
  'unidad',
  'usuario',
];

const INDICES_ESPERADOS = [
  'alumno_profesor_asignado_index',
  'categoria_ejercicio_nombre_lower_unique',
  'dia_del_plan_plan_orden_index',
  'ejercicio_categoria_id_index',
  'ejercicio_material_id_index',
  'ejercicio_nombre_lower_unique',
  'ejercicio_planificado_dia_del_plan_index',
  'ejercicio_planificado_ejercicio_index',
  'ejercicio_planificado_plan_bloque_index',
  'ejercicio_realizado_ejercicio_index',
  'entrenamiento_alumno_fecha_index',
  'entrenamiento_plan_id_index',
  'material_nombre_lower_unique',
  'objetivo_plan_nombre_lower_unique',
  'plan_alumno_fecha_desde_index',
  'plan_alumno_numero_index',
  'plan_objetivo_id_index',
  'plan_profesor_id_index',
  'prescripcion_semanal_plan_semana_unique',
  'serie_ejercicio_realizado_index',
  'unidad_nombre_lower_unique',
];

async function tablasDeNegocio(entorno: EntornoPostgres): Promise<string[]> {
  const filas = await entorno.orm.em.getConnection().execute<{ tablename: string }[]>(
    `select tablename from pg_tables where schemaname = 'public' and tablename <> 'mikro_orm_migrations' order by tablename;`,
  );

  return filas.map((fila) => fila.tablename);
}

async function indicesDeNegocio(entorno: EntornoPostgres): Promise<string[]> {
  const filas = await entorno.orm.em.getConnection().execute<{ indexname: string }[]>(
    `select indexname from pg_indexes where schemaname = 'public' order by indexname;`,
  );

  return filas.map((fila) => fila.indexname);
}

describe(`migración de add-usuario-identity sobre PostgreSQL 18 (${POSTGRES_IMAGE})`, () => {
  let entorno: EntornoPostgres;

  beforeAll(async () => {
    entorno = await iniciarPostgres();
  }, 180_000);

  afterAll(async () => {
    await cerrarPostgres(entorno);
  });

  it('[migracion] aplica y crea las tablas de negocio sin insertar filas', async () => {
    await entorno.orm.migrator.up();

    expect(await tablasDeNegocio(entorno)).toEqual(TABLAS_ESPERADAS);

    for (const tabla of TABLAS_ESPERADAS) {
      const [fila] = await entorno.orm
        .em!.getConnection()
        .execute<{ total: string }[]>(`select count(*)::text as total from "${tabla}";`);

      expect(fila.total, `la tabla ${tabla} debe quedar vacía`).toBe('0');
    }
  }, 120_000);

  it('[migracion] declara los índices de búsqueda y de integridad', async () => {
    const indices = await indicesDeNegocio(entorno);

    expect(indices.filter((indice) => INDICES_ESPERADOS.includes(indice))).toEqual(
      INDICES_ESPERADOS,
    );
  }, 60_000);

  it('[migracion] revierte sin dejar ninguna tabla del cambio', async () => {
    await entorno.orm.migrator.down({ to: 0 });

    expect(await tablasDeNegocio(entorno)).toEqual([]);
  }, 60_000);
});
