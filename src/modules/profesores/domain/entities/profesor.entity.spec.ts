import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Rol } from '../../../auth/domain/entities/rol.entity.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
import { Profesor } from './profesor.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');
const edicion = new Date('2026-02-01T10:00:00.000Z');

function crearUsuario(email = 'ana@gym.com'): Usuario {
  const rol = Rol.crear({
    codigo: 'PROFESOR',
    nombre: 'Profesor',
    createdAt: alta,
    createdById: null,
  });

  return Usuario.crear({
    email,
    passwordHash: 'hash-argon2id',
    rol,
    createdAt: alta,
    createdById: null,
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
    createdAt: alta,
    createdById: null,
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
  });

  it('[profesor] la baja exige actor y la reactivacion restaura el estado activo', () => {
    const profesor = crearProfesor();

    expect(() => profesor.darDeBaja(undefined as unknown as number, edicion)).toThrow(
      ErrorSemantico,
    );
    expect(profesor.estaActivo()).toBe(true);

    profesor.darDeBaja(7, edicion);

    expect(profesor.estaActivo()).toBe(false);
    expect(profesor.deletedAt).toBe(edicion);
    expect(profesor.deletedById).toBe(7);

    profesor.reactivar(8, edicion);

    expect(profesor.estaActivo()).toBe(true);
    expect(profesor.deletedAt).toBeNull();
    expect(profesor.deletedById).toBeNull();
    expect(profesor.nombre).toBe('Ana Profesora');
  });

  it('[profesor] una edicion actualiza el ultimo responsable y no toca los datos de alta', () => {
    const profesor = crearProfesor();

    profesor.registrarEdicion(9, edicion);

    expect(profesor.updatedAt).toBe(edicion);
    expect(profesor.updatedById).toBe(9);
    expect(profesor.ultimoResponsableId).toBe(9);
    expect(profesor.createdAt).toBe(alta);
  });
});
