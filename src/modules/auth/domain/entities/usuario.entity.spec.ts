import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from './permiso.entity.js';
import { Rol } from './rol.entity.js';
import { Usuario } from './usuario.entity.js';

const edicion = new Date('2026-02-01T10:00:00.000Z');

beforeAll(() => {
  initOrmMetadata();
});

function crearRol(nombre: string, permisos: Permiso[] = []): Rol {
  const rol = Rol.crear({ nombre });
  permisos.forEach((permiso) => rol.asignarPermiso(permiso));

  return rol;
}

function crearPermiso(nombre: string): Permiso {
  return Permiso.crear({ nombre });
}

function crearUsuario(
  email = 'alumno@gym.com',
  rol = crearRol('Alumno'),
): Usuario {
  return Usuario.crear({
    email,
    passwordHash: 'hash-argon2id',
    rol,
  });
}

describe('Usuario', () => {
  it('[usuario] rechaza un email vacio', () => {
    expect(() => crearUsuario('   ')).toThrow(ErrorSemantico);
  });

  it('[usuario][RN-32] normaliza el email a minusculas sin espacios circundantes', () => {
    expect(crearUsuario('  Alumno@Gym.com ').email).toBe('alumno@gym.com');
  });

  it('[usuario] exige un rol', () => {
    expect(() =>
      Usuario.crear({
        email: 'alumno@gym.com',
        passwordHash: 'hash-argon2id',
        rol: undefined as unknown as Rol,
      }),
    ).toThrow(ErrorSemantico);
  });

  it('[usuario] exige un hash de credencial', () => {
    expect(() =>
      Usuario.crear({
        email: 'alumno@gym.com',
        passwordHash: '  ',
        rol: crearRol('Alumno'),
      }),
    ).toThrow(ErrorSemantico);
  });

  it('[usuario] no expone contraseña en claro ni un estado activo persistido', () => {
    const usuario = crearUsuario();

    expect('password' in usuario).toBe(false);
    expect('activo' in usuario).toBe(false);
    expect(usuario.passwordHash).toBe('hash-argon2id');
    expect(usuario.estaActivo()).toBe(true);
  });

  it('[usuario] los permisos efectivos son los del rol', () => {
    const rol = crearRol('Profesor', [crearPermiso('Crear plan')]);
    const usuario = crearUsuario('profesor@gym.com', rol);

    expect(
      usuario.permisosEfectivos().map((permiso) => permiso.nombre),
    ).toEqual(['Crear plan']);
  });

  it('[usuario] un rol sin permisos no habilita ninguna operacion de gestion', () => {
    const usuario = crearUsuario('alumno@gym.com', crearRol('Alumno'));

    expect(usuario.permisosEfectivos()).toEqual([]);
  });

  it('[usuario] excluye de los permisos efectivos el permiso dado de baja', () => {
    const permiso = crearPermiso('Crear plan');
    const rol = crearRol('Profesor', [permiso]);
    const usuario = crearUsuario('profesor@gym.com', rol);

    permiso.deletedAt = edicion;

    expect(usuario.permisosEfectivos()).toEqual([]);
  });

  it('[usuario] deriva el estado activo de la baja lógica', () => {
    const usuario = crearUsuario();

    expect(usuario.estaActivo()).toBe(true);

    usuario.deletedAt = edicion;

    expect(usuario.estaActivo()).toBe(false);
  });
});
