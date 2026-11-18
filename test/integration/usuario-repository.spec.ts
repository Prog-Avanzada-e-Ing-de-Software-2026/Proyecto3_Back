import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { MikroOrmUsuarioRepository } from '../../src/modules/auth/infrastructure/repositories/mikro-orm-usuario.repository.js';
import { cerrarPostgres, iniciarPostgres, vaciarTablas } from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

let entorno: EntornoPostgres;

function asignarAlta<T extends { createdAt?: Date }>(entidad: T): T {
  entidad.createdAt = new Date('2026-01-01T10:00:00.000Z');

  return entidad;
}

function repositorio(): MikroOrmUsuarioRepository {
  return new MikroOrmUsuarioRepository(entorno.orm.em.fork().getRepository(Usuario));
}

async function sembrarUsuario(dadoDeBaja = false): Promise<Usuario> {
  const em = entorno.orm.em.fork();
  const permisoVigente = asignarAlta(Permiso.crear({ nombre: 'plan:crear' }));
  const permisoDadoDeBaja = asignarAlta(Permiso.crear({ nombre: 'alumno:consultar' }));
  const rol = asignarAlta(
    Rol.crear({
      nombre: 'Profesor',
      permisos: [permisoVigente, permisoDadoDeBaja],
    }),
  );
  const usuario = asignarAlta(
    Usuario.crear({
      email: 'Profesor@Gym.com',
      passwordHash: 'hash-almacenado',
      rol,
    }),
  );

  if (dadoDeBaja) {
    usuario.deletedAt = new Date('2026-02-01T10:00:00.000Z');
    usuario.deletedById = 1;
  }

  em.persist([permisoVigente, permisoDadoDeBaja, rol, usuario]);
  await em.flush();

  // La baja se completa después de que existe el actor: la base exige fecha y
  // autor juntos, y el autor referencia a `usuario`.
  permisoDadoDeBaja.deletedAt = new Date('2026-02-01T10:00:00.000Z');
  permisoDadoDeBaja.deletedById = usuario.id;
  await em.flush();

  return usuario;
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

describe('MikroOrmUsuarioRepository', () => {
  it('[identidad-usuario] encuentra por email normalizado y con el rol y los permisos poblados', async () => {
    await sembrarUsuario();

    const usuario = await repositorio().findByEmail('profesor@gym.com');

    expect(usuario).not.toBeNull();
    expect(usuario?.email).toBe('profesor@gym.com');
    expect(usuario?.rol.nombre).toBe('Profesor');
    expect(usuario?.permisosEfectivos().map((permiso) => permiso.nombre)).toEqual(['plan:crear']);
  });

  it('[RN-34] la lectura habitual oculta al usuario dado de baja', async () => {
    const sembrado = await sembrarUsuario(true);

    await expect(repositorio().findByEmail('profesor@gym.com')).resolves.toBeNull();
    await expect(repositorio().findById(sembrado.id)).resolves.toBeNull();
  });

  it('[identidad-usuario] la variante explícita devuelve al usuario dado de baja', async () => {
    await sembrarUsuario(true);

    const usuario = await repositorio().findByEmailIncluyendoBaja('profesor@gym.com');

    expect(usuario).not.toBeNull();
    expect(usuario?.estaActivo()).toBe(false);
  });

  it('[autenticacion-sesion] encuentra por identificador para revalidar la sesión', async () => {
    const sembrado = await sembrarUsuario();

    const usuario = await repositorio().findById(sembrado.id);

    expect(usuario?.id).toBe(sembrado.id);
    expect(usuario?.rol.nombre).toBe('Profesor');
  });

  it('[autenticacion-sesion] devuelve null cuando el email no existe', async () => {
    await expect(repositorio().findByEmail('nadie@gym.com')).resolves.toBeNull();
  });
});
