import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from '../../src/modules/auth/auth.module.js';
import { CreatePermisoUseCase } from '../../src/modules/auth/application/use-cases/create-permiso.use-case.js';
import { NOMBRES_ROL, NOMBRES_PERMISO } from '../../src/modules/auth/domain/catalogos.js';
import { Argon2PasswordHasher } from '../../src/modules/auth/infrastructure/services/argon2-password-hasher.js';
import { runCatalogoIdentidad } from '../../src/seeder/catalogo-identidad.seed.js';
import { runUsuarioInicial } from '../../src/seeder/usuario-inicial.seed.js';
import {
  configuracionOrm,
  POSTGRES_IMAGE,
  vaciarTablas,
} from '../support/postgres.js';

let container: StartedPostgreSqlContainer;
let modulo: TestingModule;
let orm: MikroORM;

async function contar(tabla: string): Promise<number> {
  const [fila] = await orm.em
    .getConnection()
    .execute<{ total: string }[]>(
      `select count(*)::text as total from "${tabla}";`,
    );

  return Number(fila.total);
}

async function permisosDeRol(nombre: string): Promise<string[]> {
  const filas = await orm.em.getConnection().execute<{ nombre: string }[]>(
    `select p."nombre" from "rol_permiso" rp
       join "rol" r on r."id" = rp."rol_id"
       join "permiso" p on p."id" = rp."permiso_id"
      where r."nombre" = ? order by p."nombre";`,
    [nombre],
  );

  return filas.map((fila) => fila.nombre);
}

beforeAll(async () => {
  container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  modulo = await Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot(
        configuracionOrm(container, { allowGlobalContext: false }),
      ),
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

function correrSeedAdmin(): Promise<void> {
  return RequestContext.create(orm.em, () => runUsuarioInicial(modulo));
}

async function conVariables<T>(variables: Record<string, string>, correr: () => Promise<T>) {
  const previos = Object.fromEntries(
    Object.keys(variables).map((nombre) => [nombre, process.env[nombre]]),
  );
  Object.assign(process.env, variables);

  try {
    return await correr();
  } finally {
    for (const [nombre, valor] of Object.entries(previos)) {
      if (valor === undefined) {
        delete process.env[nombre];
      } else {
        process.env[nombre] = valor;
      }
    }
  }
}

const ADMIN = { email: 'admin@gym.com', password: 'unaClaveSegura' };

afterAll(async () => {
  await modulo.close();
  await container.stop();
});

describe('seed catalogo-identidad', () => {
  it('[seeder] deja los tres roles, los siete permisos y sus asignaciones', async () => {
    await correrSeed();

    expect(await contar('rol')).toBe(3);
    expect(await contar('permiso')).toBe(7);
    expect(await contar('rol_permiso')).toBe(7);

    expect(await permisosDeRol(NOMBRES_ROL.ADMINISTRADOR)).toEqual([
      NOMBRES_PERMISO.PERMISO_CONSULTAR,
      NOMBRES_PERMISO.PERMISO_CREAR,
      NOMBRES_PERMISO.PERMISO_EDITAR,
      NOMBRES_PERMISO.ROL_CONSULTAR,
      NOMBRES_PERMISO.ROL_CREAR,
      NOMBRES_PERMISO.ROL_EDITAR,
      NOMBRES_PERMISO.ROL_PERMISOS,
    ]);
    expect(await permisosDeRol(NOMBRES_ROL.PROFESOR)).toEqual([]);
    expect(await permisosDeRol(NOMBRES_ROL.ALUMNO)).toEqual([]);
  });

  it('[seeder] una segunda ejecución no agrega ni modifica filas', async () => {
    await correrSeed();
    const antes = await orm.em
      .getConnection()
      .execute<{ id: number; nombre: string }[]>(
        'select "id", "nombre" from "rol" order by "id";',
      );

    await correrSeed();
    const despues = await orm.em
      .getConnection()
      .execute<{ id: number; nombre: string }[]>(
        'select "id", "nombre" from "rol" order by "id";',
      );

    expect(despues).toEqual(antes);
    expect(await contar('rol')).toBe(3);
    expect(await contar('permiso')).toBe(7);
  });

  it('[seeder] converge después de una ejecución interrumpida entre permisos y roles', async () => {
    const crearPermiso = modulo.get(CreatePermisoUseCase);
    await RequestContext.create(orm.em, () =>
      crearPermiso.execute({
        nombre: NOMBRES_PERMISO.ROL_CONSULTAR,
      }),
    );

    await correrSeed();

    expect(await contar('permiso')).toBe(7);
    expect(await contar('rol')).toBe(3);
    expect(await contar('rol_permiso')).toBe(7);
  });
});

describe('seed usuario-inicial', () => {
  beforeEach(async () => {
    await correrSeed();
  });

  it('[identidad-usuario] crea el administrador con su credencial hasheada', async () => {
    await conVariables(
      { ADMIN_INICIAL_EMAIL: ADMIN.email, ADMIN_INICIAL_PASSWORD: ADMIN.password },
      correrSeedAdmin,
    );

    const [fila] = await orm.em.getConnection().execute<
      { email: string; password_hash: string; rol: string }[]
    >(
      `select u."email", u."password_hash", r."nombre" as rol
         from "usuario" u join "rol" r on r."id" = u."rol_id"
        where u."email" = ?;`,
      [ADMIN.email],
    );

    expect(fila?.rol).toBe(NOMBRES_ROL.ADMINISTRADOR);
    expect(fila?.password_hash).not.toContain(ADMIN.password);
    await expect(
      new Argon2PasswordHasher().verify(fila?.password_hash ?? '', ADMIN.password),
    ).resolves.toBe(true);
  });

  it('[identidad-usuario] una segunda ejecución no duplica ni cambia la credencial', async () => {
    await conVariables(
      { ADMIN_INICIAL_EMAIL: ADMIN.email, ADMIN_INICIAL_PASSWORD: ADMIN.password },
      correrSeedAdmin,
    );
    const [antes] = await orm.em
      .getConnection()
      .execute<{ password_hash: string }[]>(
        'select "password_hash" from "usuario" where "email" = ?;',
        [ADMIN.email],
      );

    await conVariables(
      { ADMIN_INICIAL_EMAIL: ADMIN.email, ADMIN_INICIAL_PASSWORD: 'otraClaveDistinta' },
      correrSeedAdmin,
    );

    const [despues] = await orm.em
      .getConnection()
      .execute<{ password_hash: string }[]>(
        'select "password_hash" from "usuario" where "email" = ?;',
        [ADMIN.email],
      );

    expect(await contar('usuario')).toBe(1);
    expect(despues?.password_hash).toBe(antes?.password_hash);
  });

  it('[identidad-usuario] falla sin el rol en el catálogo y no persiste', async () => {
    await vaciarTablas(orm);

    await expect(
      conVariables(
        { ADMIN_INICIAL_EMAIL: ADMIN.email, ADMIN_INICIAL_PASSWORD: ADMIN.password },
        correrSeedAdmin,
      ),
    ).rejects.toMatchObject({ codigo: 'ROL_NO_ENCONTRADO' });

    expect(await contar('usuario')).toBe(0);
  });
});
