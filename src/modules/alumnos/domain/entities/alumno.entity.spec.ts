import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Rol } from '../../../auth/domain/entities/rol.entity.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
import { Profesor } from '../../../profesores/domain/entities/profesor.entity.js';
import { Alumno } from './alumno.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');

function crearUsuario(email: string): Usuario {
  const rol = Rol.crear({ nombre: 'Alumno' });

  return Usuario.crear({
    email,
    passwordHash: 'hash-argon2id',
    rol,
  });
}

function crearProfesor(): Profesor {
  return Profesor.crear({
    nombre: 'Ana Profesora',
    fechaNacimiento: '1985-05-04',
    numeroDocumento: '30111222',
    numeroTelefono: '1144445555',
    fechaIngreso: alta,
    usuario: crearUsuario('ana@gym.com'),
  });
}

function crearAlumno(overrides: Partial<Parameters<typeof Alumno.crear>[0]> = {}): Alumno {
  return Alumno.crear({
    nombre: 'Juan Perez',
    fechaNacimiento: '2000-03-15',
    numeroDocumento: '00123456',
    numeroTelefono: '1155556666',
    fechaIngreso: alta,
    usuario: crearUsuario('juan@gym.com'),
    ...overrides,
  });
}

describe('Alumno', () => {
  it('[alumno] rechaza los campos obligatorios vacios', () => {
    expect(() => crearAlumno({ nombre: '  ' })).toThrow(ErrorSemantico);
    expect(() => crearAlumno({ numeroDocumento: '  ' })).toThrow(ErrorSemantico);
    expect(() => crearAlumno({ numeroTelefono: '  ' })).toThrow(ErrorSemantico);
    expect(() => crearAlumno({ usuario: undefined as unknown as Usuario })).toThrow(ErrorSemantico);
  });

  it('[alumno] rechaza una fecha de nacimiento con formato invalido', () => {
    expect(() => crearAlumno({ fechaNacimiento: '2000-3-5' })).toThrow(ErrorSemantico);
    expect(() => crearAlumno({ fechaNacimiento: '2000-02-30' })).toThrow(ErrorSemantico);
  });

  it('[alumno][RN-33] conserva los ceros a la izquierda del numero de documento', () => {
    expect(crearAlumno({ numeroDocumento: '00123456' }).numeroDocumento).toBe('00123456');
  });

  it('[alumno] un alumno sin profesor asignado es valido', () => {
    const alumno = crearAlumno();

    expect(alumno.profesorAsignado).toBeNull();
    expect(alumno.estaActivo()).toBe(true);
    expect(alumno.activo).toBe(true);
  });

  it('[alumno] expone el identificador de sus referencias sin persistirlo aparte', () => {
    const alumno = crearAlumno();

    expect(alumno.usuarioId).toBe(alumno.usuario.id);
    expect(alumno.profesorAsignadoId).toBeNull();
  });

  it('[alumno] la baja solo cambia el estado activo y no escribe auditoría', () => {
    const alumno = crearAlumno();

    alumno.darDeBaja();

    expect(alumno.estaActivo()).toBe(false);
    expect(alumno.activo).toBe(false);
    expect(alumno.deletedAt).toBeNull();
    expect(alumno.deletedById).toBeNull();
    expect(alumno.updatedAt).toBeNull();
    expect(alumno.updatedById).toBeNull();
  });

  it('[alumno] rechaza dar de baja dos veces', () => {
    const alumno = crearAlumno();
    alumno.darDeBaja();

    expect(() => alumno.darDeBaja()).toThrow(ErrorSemantico);
  });

  it('[alumno][RN-30] la reactivacion conserva el resto del registro', () => {
    const profesor = crearProfesor();
    const alumno = crearAlumno({ profesorAsignado: profesor });
    alumno.darDeBaja();

    alumno.reactivar();

    expect(alumno.estaActivo()).toBe(true);
    expect(alumno.activo).toBe(true);
    expect(alumno.profesorAsignado).toBe(profesor);
    expect(alumno.nombre).toBe('Juan Perez');
  });

  it('[alumno] rechaza reactivar un alumno activo', () => {
    const alumno = crearAlumno();

    expect(() => alumno.reactivar()).toThrow(ErrorSemantico);
  });
});
