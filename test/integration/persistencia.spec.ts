import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import { Alumno } from '../../src/modules/alumnos/domain/entities/alumno.entity.js';
import { Profesor } from '../../src/modules/profesores/domain/entities/profesor.entity.js';
import {
  cerrarPostgres,
  iniciarPostgres,
  vaciarTablas,
} from '../support/postgres.js';
import type { EntornoPostgres } from '../support/postgres.js';

const alta = new Date('2026-01-01T10:00:00.000Z');
const edicion = new Date('2026-02-01T10:00:00.000Z');

let entorno: EntornoPostgres;

function crearRol(codigo: string): Rol {
  return Rol.crear({ codigo, nombre: codigo, createdAt: alta });
}

function crearUsuario(email: string, rol: Rol, createdById: number | null = null): Usuario {
  return Usuario.crear({ email, passwordHash: 'hash-argon2id', rol, createdAt: alta, createdById });
}

function crearAlumno(
  email: string,
  documento: string,
  nombre = 'Juan Perez',
  usuarioRol: Rol = crearRol('ALUMNO'),
  createdById: number | null = null,
): Alumno {
  return Alumno.crear({
    nombre,
    fechaNacimiento: '2000-03-15',
    numeroDocumento: documento,
    numeroTelefono: '1155556666',
    fechaIngreso: alta,
    usuario: crearUsuario(email, usuarioRol, createdById),
    createdAt: alta,
    createdById,
  });
}

function crearProfesor(
  email: string,
  documento: string,
  nombre = 'Ana Profesora',
  usuarioRol: Rol = crearRol('PROFESOR'),
): Profesor {
  return Profesor.crear({
    nombre,
    fechaNacimiento: '1985-05-04',
    numeroDocumento: documento,
    numeroTelefono: '1144445555',
    fechaIngreso: alta,
    usuario: crearUsuario(email, usuarioRol),
    createdAt: alta,
  });
}

async function crearAdministrador(): Promise<Usuario> {
  const rol = crearRol('ADMINISTRADOR');
  const usuario = crearUsuario('admin@gym.com', rol);
  await persistir([rol, usuario]);

  return usuario;
}

async function persistir(entidades: object | object[]): Promise<void> {
  entorno.orm.em.persist(entidades);
  await entorno.orm.em.flush();
}

beforeAll(async () => {
  entorno = await iniciarPostgres();
  await entorno.orm.migrator.up();
}, 180_000);

beforeEach(async () => {
  await vaciarTablas(entorno.orm);
});

afterEach(() => {
  entorno.orm.em.clear();
});

afterAll(async () => {
  await cerrarPostgres(entorno);
});

describe('persistencia del modelo de identidad', () => {
  it('[persistencia][RN-32] rechaza un email repetido sin distinguir mayúsculas', async () => {
    const rol = crearRol('ALUMNO');
    const primero = crearUsuario('alumno@gym.com', rol);
    await persistir([rol, primero]);

    const segundo = crearUsuario('ALUMNO@GYM.COM', rol);

    await expect(persistir(segundo)).rejects.toThrow();
  });

  it('[persistencia] rechaza códigos de rol y de permiso repetidos', async () => {
    const rol = crearRol('PROFESOR');
    await persistir(rol);

    await expect(persistir(crearRol('profesor'))).rejects.toThrow();
    entorno.orm.em.clear();

    const permiso = Permiso.crear({ codigo: 'CREAR_PLAN', nombre: 'Crear plan', createdAt: alta });
    await persistir(permiso);

    await expect(
      persistir(
        Permiso.crear({ codigo: 'crear_plan', nombre: 'Crear plan', createdAt: alta }),
      ),
    ).rejects.toThrow();
  });

  it('[persistencia][RN-25] rechaza el mismo documento en el mismo agregado aunque cambie el nombre', async () => {
    const primero = crearAlumno('uno@gym.com', '00123456', 'Juan Perez');
    await persistir(primero);

    const segundo = crearAlumno('dos@gym.com', '00123456', 'Juan P. Perez');

    await expect(persistir(segundo)).rejects.toThrow();
  });

  it('[persistencia][RN-25] admite el mismo documento en un Alumno y en un Profesor', async () => {
    const alumno = crearAlumno('alumno@gym.com', '00123456');
    const profesor = crearProfesor('profesor@gym.com', '00123456');

    await persistir([alumno, profesor]);

    expect(alumno.id).toBeGreaterThan(0);
    expect(profesor.id).toBeGreaterThan(0);
  });

  it('[persistencia] rechaza un segundo perfil de Alumno para el mismo Usuario', async () => {
    const alumno = crearAlumno('alumno@gym.com', '00123456');
    await persistir(alumno);

    const segundo = Alumno.crear({
      nombre: 'Otro Nombre',
      fechaNacimiento: '2001-01-01',
      numeroDocumento: '00999888',
      numeroTelefono: '1100000000',
      fechaIngreso: alta,
      usuario: alumno.usuario,
      createdAt: alta,
    });

    await expect(persistir(segundo)).rejects.toThrow();
  });

  it('[persistencia] rechaza un Usuario sin rol o con rol inexistente', async () => {
    const conexion = entorno.orm.em.getConnection();

    await expect(
      conexion.execute(
        `insert into "usuario" ("email", "password_hash", "rol_id", "created_at") values ('sinrol@gym.com', 'hash', null, now());`,
      ),
    ).rejects.toThrow();

    await expect(
      conexion.execute(
        `insert into "usuario" ("email", "password_hash", "rol_id", "created_at") values ('malrol@gym.com', 'hash', 999999, now());`,
      ),
    ).rejects.toThrow();
  });

  it('[persistencia] rechaza el mismo permiso dos veces en un rol', async () => {
    const rol = crearRol('PROFESOR');
    const permiso = Permiso.crear({ codigo: 'CREAR_PLAN', nombre: 'Crear plan', createdAt: alta });
    await persistir([rol, permiso]);

    const conexion = entorno.orm.em.getConnection();
    await conexion.execute(
      `insert into "rol_permiso" ("rol_id", "permiso_id") values (${rol.id}, ${permiso.id});`,
    );

    await expect(
      conexion.execute(
        `insert into "rol_permiso" ("rol_id", "permiso_id") values (${rol.id}, ${permiso.id});`,
      ),
    ).rejects.toThrow();
  });

  it('[persistencia] rechaza una baja con fecha y sin autor, o al revés', async () => {
    const administrador = await crearAdministrador();
    const rol = crearRol('PROFESOR');
    await persistir(rol);

    const conexion = entorno.orm.em.getConnection();

    await expect(
      conexion.execute(`update "rol" set "deleted_at" = now() where "id" = ${rol.id};`),
    ).rejects.toThrow();

    await expect(
      conexion.execute(
        `update "rol" set "deleted_by_id" = ${administrador.id} where "id" = ${rol.id};`,
      ),
    ).rejects.toThrow();
  });

  it('[persistencia][RN-30] el filtro excluye los dados de baja y la reactivación los vuelve a incluir', async () => {
    const administrador = await crearAdministrador();
    const rol = crearRol('PROFESOR');
    await persistir(rol);

    rol.darDeBaja(administrador.id, edicion);
    await entorno.orm.em.flush();
    entorno.orm.em.clear();

    expect(await entorno.orm.em.find(Rol, { codigo: 'PROFESOR' })).toHaveLength(0);
    expect(
      await entorno.orm.em.find(Rol, { codigo: 'PROFESOR' }, { filters: { bajaLogica: false } }),
    ).toHaveLength(1);

    const paraReactivar = await entorno.orm.em.findOneOrFail(
      Rol,
      { codigo: 'PROFESOR' },
      { filters: { bajaLogica: false } },
    );
    paraReactivar.reactivar(administrador.id, edicion);
    await entorno.orm.em.flush();
    entorno.orm.em.clear();

    expect(await entorno.orm.em.find(Rol, { codigo: 'PROFESOR' })).toHaveLength(1);
  });

  it('[persistencia] conserva la auditoría de alta, edición y baja', async () => {
    const administrador = await crearAdministrador();
    const rol = crearRol('PROFESOR');
    await persistir(rol);

    rol.registrarEdicion(administrador.id, edicion);
    await entorno.orm.em.flush();

    rol.darDeBaja(administrador.id, new Date('2026-03-01T10:00:00.000Z'));
    await entorno.orm.em.flush();
    entorno.orm.em.clear();

    const persistido = await entorno.orm.em.findOneOrFail(
      Rol,
      { codigo: 'PROFESOR' },
      { filters: { bajaLogica: false } },
    );

    expect(persistido.createdAt).toEqual(alta);
    expect(persistido.createdById).toBeNull();
    expect(persistido.updatedAt).toEqual(new Date('2026-03-01T10:00:00.000Z'));
    expect(persistido.updatedById).toBe(administrador.id);
    expect(persistido.deletedAt).toEqual(new Date('2026-03-01T10:00:00.000Z'));
    expect(persistido.deletedById).toBe(administrador.id);
  });
});
