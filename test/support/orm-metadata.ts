import { Configuration, EntityHelper, EntityManager, MetadataDiscovery, MetadataStorage } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Alumno } from '../../src/modules/alumnos/domain/entities/alumno.entity.js';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { Profesor } from '../../src/modules/profesores/domain/entities/profesor.entity.js';

const ENTIDADES = [Usuario, Rol, Permiso, Alumno, Profesor];

/**
 * Prepara la metadata de MikroORM sin abrir conexión.
 *
 * Las pruebas unitarias de entidades necesitan la metadata para operar sobre
 * `Collection`; no necesitan PostgreSQL, y este helper no lo levanta.
 */
export function initOrmMetadata(): void {
  const config = new Configuration(
    {
      entities: ENTIDADES,
      dbName: 'metadata-de-unidad',
      metadataProvider: ReflectMetadataProvider,
      driver: PostgreSqlDriver,
    },
    false,
  );

  const storage = new MetadataDiscovery(
    new MetadataStorage(),
    config.getPlatform(),
    config,
  ).discoverSync();

  const driver = new PostgreSqlDriver(config as never);
  const em = new EntityManager(config as never, driver, storage);

  for (const meta of storage.getAll().values()) {
    EntityHelper.decorate(meta, em);
  }
}
