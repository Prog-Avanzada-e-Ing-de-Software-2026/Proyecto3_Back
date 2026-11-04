import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { CODIGOS_ROL, NOMBRES_PERMISO } from '../codigos.js';
import { Permiso } from './permiso.entity.js';
import { Rol } from './rol.entity.js';
import { Usuario } from './usuario.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');
const edicion = new Date('2026-02-01T10:00:00.000Z');

beforeAll(() => {
  initOrmMetadata();
});

function crearRol(codigo: string, permisos: Permiso[] = []): Rol {
  const rol = Rol.crear({ codigo, nombre: codigo, createdAt: alta, createdById: null });
  permisos.forEach((permiso) => rol.asignarPermiso(permiso, 1, alta));

  return rol;
}

function crearPermiso(nombre: string): Permiso {
  return Permiso.crear({ nombre, createdAt: alta, createdById: null });
}

function crearUsuario(email = 'alumno@gym.com', rol = crearRol(CODIGOS_ROL.ALUMNO)): Usuario {
  return Usuario.crear({
    email,
    passwordHash: 'hash-argon2id',
    rol,
    createdAt: alta,
    createdById: null,
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
        createdAt: alta,
        createdById: null,
      }),
    ).toThrow(ErrorSemantico);
  });

  it('[usuario] exige un hash de credencial', () => {
    expect(() =>
      Usuario.crear({
        email: 'alumno@gym.com',
        passwordHash: '  ',
        rol: crearRol(CODIGOS_ROL.ALUMNO),
        createdAt: alta,
        createdById: null,
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
    const rol = crearRol(CODIGOS_ROL.PROFESOR, [crearPermiso(NOMBRES_PERMISO.CREAR_PLAN)]);
    const usuario = crearUsuario('profesor@gym.com', rol);

    expect(usuario.permisosEfectivos().map((permiso) => permiso.nombre)).toEqual([
      NOMBRES_PERMISO.CREAR_PLAN,
    ]);
  });

  it('[usuario] un rol sin permisos no habilita ninguna operacion de gestion', () => {
    const usuario = crearUsuario('alumno@gym.com', crearRol(CODIGOS_ROL.ALUMNO));

    expect(usuario.permisosEfectivos()).toEqual([]);
  });

  it('[usuario] excluye de los permisos efectivos el permiso dado de baja', () => {
    const permiso = crearPermiso(NOMBRES_PERMISO.CREAR_PLAN);
    const rol = crearRol(CODIGOS_ROL.PROFESOR, [permiso]);
    const usuario = crearUsuario('profesor@gym.com', rol);

    permiso.darDeBaja(1, edicion);

    expect(usuario.permisosEfectivos()).toEqual([]);
  });

  it('[usuario] aplica la baja logica y la reactivacion con actor', () => {
    const usuario = crearUsuario();

    usuario.darDeBaja(7, edicion);

    expect(usuario.estaActivo()).toBe(false);
    expect(usuario.deletedAt).toBe(edicion);
    expect(usuario.deletedById).toBe(7);

    usuario.reactivar(8, edicion);

    expect(usuario.estaActivo()).toBe(true);
    expect(usuario.deletedAt).toBeNull();
    expect(usuario.deletedById).toBeNull();
  });
});
