import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Rol } from '../../../auth/domain/entities/rol.entity.js';
import { Usuario } from '../../../auth/domain/entities/usuario.entity.js';
import { Profesor } from '../../../profesores/domain/entities/profesor.entity.js';
import { Alumno } from './alumno.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');
const edicion = new Date('2026-02-01T10:00:00.000Z');

function crearUsuario(email: string): Usuario {
  const rol = Rol.crear({ nombre: 'Alumno', createdAt: alta, createdById: null });

  return Usuario.crear({
    email,
    passwordHash: 'hash-argon2id',
    rol,
    createdAt: alta,
    createdById: null,
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
    createdAt: alta,
    createdById: null,
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
    createdAt: alta,
    createdById: null,
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

  it('[alumno] la baja exige actor y escribe fecha y autor juntos', () => {
    const alumno = crearAlumno();

    expect(() => alumno.darDeBaja(undefined as unknown as number, edicion)).toThrow(ErrorSemantico);
    expect(alumno.estaActivo()).toBe(true);

    alumno.darDeBaja(7, edicion);

    expect(alumno.estaActivo()).toBe(false);
    expect(alumno.activo).toBe(false);
    expect(alumno.deletedAt).toBe(edicion);
    expect(alumno.deletedById).toBe(7);
  });

  it('[alumno][RN-30] la reactivacion limpia la baja y conserva el resto del registro', () => {
    const profesor = crearProfesor();
    const alumno = crearAlumno({ profesorAsignado: profesor });
    alumno.darDeBaja(7, edicion);

    alumno.reactivar(8, edicion);

    expect(alumno.estaActivo()).toBe(true);
    expect(alumno.activo).toBe(true);
    expect(alumno.deletedAt).toBeNull();
    expect(alumno.deletedById).toBeNull();
    expect(alumno.profesorAsignado).toBe(profesor);
    expect(alumno.nombre).toBe('Juan Perez');
  });

  it('[alumno] una edicion actualiza el ultimo responsable y no toca los datos de alta', () => {
    const alumno = crearAlumno();

    alumno.registrarEdicion(9, edicion);

    expect(alumno.updatedAt).toBe(edicion);
    expect(alumno.updatedById).toBe(9);
    expect(alumno.ultimoResponsableId).toBe(9);
    expect(alumno.createdAt).toBe(alta);
    expect(alumno.createdById).toBeNull();
  });
});
