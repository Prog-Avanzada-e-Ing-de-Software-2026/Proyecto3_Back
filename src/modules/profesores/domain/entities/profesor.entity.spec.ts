import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Rol } from '../../../auth/domain/entities/rol.entity.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
import { Profesor } from './profesor.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');

function crearUsuario(email = 'ana@gym.com'): Usuario {
  const rol = Rol.crear({ nombre: 'Profesor' });

  return Usuario.crear({
    email,
    passwordHash: 'hash-argon2id',
    rol,
  });
}

function crearProfesor(overrides: Partial<Parameters<typeof Profesor.crear>[0]> = {}): Profesor {
  return Profesor.crear({
    nombre: 'Ana Profesora',
    fechaNacimiento: '1985-05-04',
    numeroDocumento: '30111222',
    numeroTelefono: '1144445555',
    fechaIngreso: alta,
    usuario: crearUsuario(),
    ...overrides,
  });
}

describe('Profesor', () => {
  it('[profesor] rechaza los campos obligatorios vacios', () => {
    expect(() => crearProfesor({ nombre: '  ' })).toThrow(ErrorSemantico);
    expect(() => crearProfesor({ numeroDocumento: '  ' })).toThrow(ErrorSemantico);
    expect(() => crearProfesor({ numeroTelefono: '  ' })).toThrow(ErrorSemantico);
    expect(() => crearProfesor({ usuario: undefined as unknown as Usuario })).toThrow(
      ErrorSemantico,
    );
  });

  it('[profesor] rechaza una fecha de nacimiento invalida', () => {
    expect(() => crearProfesor({ fechaNacimiento: '1985-13-04' })).toThrow(ErrorSemantico);
  });

  it('[profesor] conserva los ceros a la izquierda del numero de documento', () => {
    expect(crearProfesor({ numeroDocumento: '00301112' }).numeroDocumento).toBe('00301112');
  });

  it('[profesor] expone el identificador de su usuario sin persistirlo aparte', () => {
    const profesor = crearProfesor();

    expect(profesor.usuarioId).toBe(profesor.usuario.id);
    expect(profesor.activo).toBe(true);
  });

  it('[profesor][RN-30] la baja y la reactivacion solo cambian el estado activo', () => {
    const profesor = crearProfesor();

    profesor.darDeBaja();

    expect(profesor.estaActivo()).toBe(false);
    expect(profesor.activo).toBe(false);
    expect(profesor.deletedAt).toBeNull();
    expect(profesor.updatedAt).toBeNull();

    profesor.reactivar();

    expect(profesor.estaActivo()).toBe(true);
    expect(profesor.activo).toBe(true);
    expect(profesor.nombre).toBe('Ana Profesora');
  });

  it('[profesor] rechaza la baja repetida y la reactivacion de un activo', () => {
    const profesor = crearProfesor();

    expect(() => profesor.reactivar()).toThrow(ErrorSemantico);

    profesor.darDeBaja();

    expect(() => profesor.darDeBaja()).toThrow(ErrorSemantico);
  });
});
