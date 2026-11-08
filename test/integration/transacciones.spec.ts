import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MikroORM } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { MikroOrmPermisoRepository } from '../../src/modules/auth/infrastructure/repositories/mikro-orm-permiso.repository.js';
import { configuracionOrm, POSTGRES_IMAGE, vaciarTablas } from '../support/postgres.js';

const alta = new Date('2026-01-01T10:00:00.000Z');

/** Fuerza un fallo después de escribir, para observar el rollback de la transacción. */
class PermisoRepositoryQueFalla extends MikroOrmPermisoRepository {
  @Transactional({ context: (self: PermisoRepositoryQueFalla) => self.repositorio })
  async saveEntoncesFallar(permiso: Permiso): Promise<void> {
    this.repositorio.getEntityManager().persist(permiso);
    throw new Error('falla simulada después de escribir');
  }
}

/** Códigos ANSI que el logger del ORM agrega a cada consulta. */
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Posición de un comando de transacción en el log del ORM. */
function indiceDe(comando: 'begin' | 'commit' | 'rollback'): number {
  return consultas.findIndex((consulta) =>
    new RegExp(`\\[query\\]\\s*${comando}\\b`).test(consulta.replace(ANSI, '')),
  );
}

function crearPermiso(nombre = 'Crear plan'): Permiso {
  const permiso = Permiso.crear({ nombre });
  permiso.createdAt = alta;

  return permiso;
}

let container: StartedPostgreSqlContainer;
let orm: MikroORM;
let consultas: string[] = [];

beforeAll(async () => {
  container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  orm = await MikroORM.init(
    configuracionOrm(container, { logger: (mensaje) => consultas.push(mensaje) }),
  );
  await orm.migrator.up();
}, 180_000);

beforeEach(async () => {
  consultas = [];
  await vaciarTablas(orm);
});

afterAll(async () => {
  await orm.close(true);
  await container.stop();
});

describe('transacción declarada con @Transactional()', () => {
  it('[transaccion] abre y confirma la transacción alrededor del insert', async () => {
    const repositorio = new MikroOrmPermisoRepository(orm.em.getRepository(Permiso));
    consultas.length = 0;

    await repositorio.save(crearPermiso());

    const inicio = indiceDe('begin');
    const insercion = consultas.findIndex((consulta) => /insert into "permiso"/i.test(consulta));
    const confirmacion = indiceDe('commit');

    expect(inicio).toBe(0);
    expect(insercion).toBeGreaterThan(inicio);
    expect(confirmacion).toBe(insercion + 1);
    expect(indiceDe('rollback')).toBe(-1);
    expect(await orm.em.count(Permiso, {})).toBe(1);
  });

  it('[transaccion] revierte la escritura cuando el método falla', async () => {
    const repositorio = new PermisoRepositoryQueFalla(orm.em.getRepository(Permiso));
    consultas.length = 0;

    await expect(repositorio.saveEntoncesFallar(crearPermiso())).rejects.toThrow(
      'falla simulada después de escribir',
    );

    expect(indiceDe('rollback')).toBeGreaterThanOrEqual(0);
    expect(indiceDe('commit')).toBe(-1);
    expect(await orm.em.count(Permiso, {})).toBe(0);
  });
});
