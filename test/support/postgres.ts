import { defineConfig, MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Alumno } from '../../src/modules/alumnos/domain/entities/alumno.entity.js';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { CategoriaEjercicio } from '../../src/modules/catalogo/categorias-ejercicio/domain/entities/categoria-ejercicio.entity.js';
import { Ejercicio } from '../../src/modules/catalogo/ejercicios/domain/entities/ejercicio.entity.js';
import { Material } from '../../src/modules/catalogo/materiales/domain/entities/material.entity.js';
import { ObjetivoPlan } from '../../src/modules/catalogo/objetivos-plan/domain/entities/objetivo-plan.entity.js';
import { Unidad } from '../../src/modules/catalogo/unidades/domain/entities/unidad.entity.js';
import { EjercicioRealizado } from '../../src/modules/entrenamientos/domain/entities/ejercicio-realizado.entity.js';
import { Entrenamiento } from '../../src/modules/entrenamientos/domain/entities/entrenamiento.entity.js';
import { Serie } from '../../src/modules/entrenamientos/domain/entities/serie.entity.js';
import { DiaDelPlan } from '../../src/modules/planes/domain/entities/dia-del-plan.entity.js';
import { EjercicioPlanificado } from '../../src/modules/planes/domain/entities/ejercicio-planificado.entity.js';
import { Plan } from '../../src/modules/planes/domain/entities/plan.entity.js';
import { PrescripcionSemanal } from '../../src/modules/planes/domain/entities/prescripcion-semanal.entity.js';
import { Profesor } from '../../src/modules/profesores/domain/entities/profesor.entity.js';

export const POSTGRES_IMAGE = 'postgres:18-alpine';

const ENTIDADES = [
  Usuario,
  Rol,
  Permiso,
  Alumno,
  Profesor,
  ObjetivoPlan,
  Material,
  Unidad,
  CategoriaEjercicio,
  Ejercicio,
  Plan,
  DiaDelPlan,
  PrescripcionSemanal,
  EjercicioPlanificado,
  Entrenamiento,
  EjercicioRealizado,
  Serie,
];

export interface EntornoPostgres {
  container: StartedPostgreSqlContainer;
  orm: MikroORM;
}

/** Configuración de MikroORM contra el contenedor; la comparten las suites de integración. */
export function configuracionOrm(
  container: StartedPostgreSqlContainer,
  opciones: { logger?: (mensaje: string) => void; allowGlobalContext?: boolean } = {},
) {
  return defineConfig({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    dbName: container.getDatabase(),
    entities: ENTIDADES,
    allowGlobalContext: opciones.allowGlobalContext ?? true,
    metadataProvider: ReflectMetadataProvider,
    ...(opciones.logger === undefined
      ? {}
      : { debug: true, logger: (mensaje: string) => opciones.logger?.(mensaje) }),
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
      'truncate table serie, ejercicio_realizado, entrenamiento, ejercicio_planificado, dia_del_plan, prescripcion_semanal, plan, ejercicio, categoria_ejercicio, unidad, material, objetivo_plan, alumno, profesor, usuario, rol_permiso, rol, permiso restart identity cascade;',
    );
}
