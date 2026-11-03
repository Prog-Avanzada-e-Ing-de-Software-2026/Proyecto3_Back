import { defineConfig, MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Alumno } from '../../src/modules/alumnos/domain/entities/alumno.entity.js';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { Profesor } from '../../src/modules/profesores/domain/entities/profesor.entity.js';

export const POSTGRES_IMAGE = 'postgres:18-alpine';

const ENTIDADES = [Usuario, Rol, Permiso, Alumno, Profesor];

export interface EntornoPostgres {
  container: StartedPostgreSqlContainer;
  orm: MikroORM;
}

/** Configuración de MikroORM contra el contenedor; la comparten las suites de integración. */
export function configuracionOrm(container: StartedPostgreSqlContainer) {
  return defineConfig({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    dbName: container.getDatabase(),
    entities: ENTIDADES,
    allowGlobalContext: true,
    metadataProvider: ReflectMetadataProvider,
    filters: {
      bajaLogica: {
        cond: { deletedAt: null },
        default: true,
        entity: ENTIDADES,
      },
    },
    extensions: [Migrator],
    migrations: {
      path: './src/migrations',
      pathTs: './src/migrations',
      transactional: true,
      allOrNothing: true,
      // El snapshot lo administra `migration:create`; correr up/down no debe reescribirlo.
      snapshotOnMigrate: false,
    },
  });
}

export async function iniciarPostgres(): Promise<EntornoPostgres> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const orm = await MikroORM.init(configuracionOrm(container));

  return { container, orm };
}

export async function cerrarPostgres(entorno: EntornoPostgres): Promise<void> {
  await entorno.orm.close(true);
  await entorno.container.stop();
}

/** Deja las tablas del cambio vacías sin depender del orden de claves foráneas. */
export async function vaciarTablas(orm: MikroORM): Promise<void> {
  await orm.em
    .getConnection()
    .execute(
      'truncate table alumno, profesor, usuario, rol_permiso, rol, permiso restart identity cascade;',
    );
}
