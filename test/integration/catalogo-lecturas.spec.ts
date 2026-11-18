import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { MikroOrmPermisoRepository } from '../../src/modules/auth/infrastructure/repositories/mikro-orm-permiso.repository.js';
import { MikroOrmRolRepository } from '../../src/modules/auth/infrastructure/repositories/mikro-orm-rol.repository.js';
import { cerrarPostgres, iniciarPostgres, vaciarTablas } from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

let entorno: EntornoPostgres;

function asignarAlta<T extends { createdAt?: Date }>(entidad: T): T {
  entidad.createdAt = new Date('2026-01-01T10:00:00.000Z');

  return entidad;
}

function roles(): MikroOrmRolRepository {
  return new MikroOrmRolRepository(entorno.orm.em.fork().getRepository(Rol));
}

function permisos(): MikroOrmPermisoRepository {
  return new MikroOrmPermisoRepository(entorno.orm.em.fork().getRepository(Permiso));
}

async function sembrar(): Promise<{ rol: Rol; vigente: Permiso; dadoDeBaja: Permiso }> {
  const em = entorno.orm.em.fork();
  const vigente = asignarAlta(Permiso.crear({ nombre: 'plan:crear' }));
  const dadoDeBaja = asignarAlta(Permiso.crear({ nombre: 'alumno:consultar' }));
  const rol = asignarAlta(
    Rol.crear({ nombre: 'Profesor', permisos: [vigente, dadoDeBaja] }),
  );
  const usuario = asignarAlta(
    Usuario.crear({ email: 'actor@gym.com', passwordHash: 'hash', rol }),
  );

  em.persist([vigente, dadoDeBaja, rol, usuario]);
  await em.flush();

  dadoDeBaja.deletedAt = new Date('2026-02-01T10:00:00.000Z');
  dadoDeBaja.deletedById = usuario.id;
  await em.flush();

  return { rol, vigente, dadoDeBaja };
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

describe('lecturas del catálogo de autorización', () => {
  it('[identidad-usuario] lista los roles con sus permisos vigentes poblados', async () => {
    await sembrar();

    const lista = await roles().findAll();

    expect(lista).toHaveLength(1);
    expect(lista[0]?.nombre).toBe('Profesor');
    // El filtro de baja lógica también alcanza a la colección populada.
    expect(lista[0]?.permisos.getItems().map((permiso) => permiso.nombre)).toEqual(['plan:crear']);
  });

  it('[identidad-usuario] encuentra un rol por identificador', async () => {
    const { rol } = await sembrar();

    const encontrado = await roles().findById(rol.id);

    expect(encontrado?.nombre).toBe('Profesor');
  });

  it('[identidad-usuario] el listado de permisos excluye los dados de baja', async () => {
    await sembrar();

    const lista = await permisos().findAll();

    expect(lista.map((permiso) => permiso.nombre)).toEqual(['plan:crear']);
  });

  it('[identidad-usuario] la unicidad de nombre ve los registros dados de baja', async () => {
    await sembrar();

    await expect(permisos().existeNombre('alumno:consultar')).resolves.toBe(true);
    await expect(permisos().existeNombre('Inexistente')).resolves.toBe(false);
  });

  it('[identidad-usuario] la unicidad excluye el propio registro al editar', async () => {
    const { rol } = await sembrar();

    await expect(roles().existeNombre('Profesor', rol.id)).resolves.toBe(false);
  });
});
