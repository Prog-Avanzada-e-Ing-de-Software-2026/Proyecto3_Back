import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from '../../src/modules/auth/auth.module.js';
import { CreatePermisoUseCase } from '../../src/modules/auth/application/use-cases/create-permiso.use-case.js';
import { CODIGOS_ROL, NOMBRES_PERMISO } from '../../src/modules/auth/domain/codigos.js';
import { runCatalogoIdentidad } from '../../src/seeder/catalogo-identidad.seed.js';
import { configuracionOrm, POSTGRES_IMAGE, vaciarTablas } from '../support/postgres.js';

let container: StartedPostgreSqlContainer;
let modulo: TestingModule;
let orm: MikroORM;

async function contar(tabla: string): Promise<number> {
  const [fila] = await orm.em
    .getConnection()
    .execute<{ total: string }[]>(`select count(*)::text as total from "${tabla}";`);

  return Number(fila.total);
}

async function permisosDeRol(codigo: string): Promise<string[]> {
  const filas = await orm.em.getConnection().execute<{ nombre: string }[]>(
    `select p."nombre" from "rol_permiso" rp
       join "rol" r on r."id" = rp."rol_id"
       join "permiso" p on p."id" = rp."permiso_id"
      where r."codigo" = ? order by p."nombre";`,
    [codigo],
  );

  return filas.map((fila) => fila.nombre);
}

beforeAll(async () => {
  container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  modulo = await Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot(configuracionOrm(container, { allowGlobalContext: false })),
      AuthModule,
    ],
  }).compile();
  orm = modulo.get(MikroORM);
  await orm.migrator.up();
}, 180_000);

beforeEach(async () => {
  await vaciarTablas(orm);
});

/** Igual que el entrypoint: el seed corre dentro de un RequestContext. */
function correrSeed(): Promise<void> {
  return RequestContext.create(orm.em, () => runCatalogoIdentidad(modulo));
}

afterAll(async () => {
  await modulo.close();
  await container.stop();
});

describe('seed catalogo-identidad', () => {
  it('[seeder] deja los tres roles, los tres permisos y sus asignaciones', async () => {
    await correrSeed();

    expect(await contar('rol')).toBe(3);
    expect(await contar('permiso')).toBe(3);
    expect(await contar('rol_permiso')).toBe(3);

    expect(await permisosDeRol(CODIGOS_ROL.ADMINISTRADOR)).toEqual([
      NOMBRES_PERMISO.GESTIONAR_ALUMNOS,
      NOMBRES_PERMISO.GESTIONAR_PROFESORES,
    ]);
    expect(await permisosDeRol(CODIGOS_ROL.PROFESOR)).toEqual([NOMBRES_PERMISO.CREAR_PLAN]);
    expect(await permisosDeRol(CODIGOS_ROL.ALUMNO)).toEqual([]);
  });

  it('[seeder] una segunda ejecución no agrega ni modifica filas', async () => {
    await correrSeed();
    const antes = await orm.em.getConnection().execute<{ id: number; codigo: string }[]>(
      'select "id", "codigo" from "rol" order by "id";',
    );

    await correrSeed();
    const despues = await orm.em.getConnection().execute<{ id: number; codigo: string }[]>(
      'select "id", "codigo" from "rol" order by "id";',
    );

    expect(despues).toEqual(antes);
    expect(await contar('rol')).toBe(3);
    expect(await contar('permiso')).toBe(3);
  });

  it('[seeder] converge después de una ejecución interrumpida entre permisos y roles', async () => {
    const crearPermiso = modulo.get(CreatePermisoUseCase);
    await RequestContext.create(orm.em, () =>
      crearPermiso.execute({
        nombre: NOMBRES_PERMISO.CREAR_PLAN,
      }),
    );

    await correrSeed();

    expect(await contar('permiso')).toBe(3);
    expect(await contar('rol')).toBe(3);
    expect(await contar('rol_permiso')).toBe(3);
  });
});
