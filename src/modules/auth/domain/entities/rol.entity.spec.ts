import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from './permiso.entity.js';
import { Rol } from './rol.entity.js';

const edicion = new Date('2026-02-01T10:00:00.000Z');

beforeAll(() => {
  initOrmMetadata();
});

function crearPermiso(nombre: string): Permiso {
  return Permiso.crear({ nombre });
}

function crearRol(nombre = 'Profesor'): Rol {
  return Rol.crear({ nombre });
}

describe('Rol', () => {
  it('[rol] un rol sin permisos es valido', () => {
    const rol = crearRol();

    expect(rol.permisos.getItems()).toHaveLength(0);
    expect(rol.nombre).toBe('Profesor');
  });

  it('[rol] recorta los espacios circundantes del nombre', () => {
    expect(crearRol('  Profesor  ').nombre).toBe('Profesor');
  });

  it('[rol] rechaza un nombre vacio', () => {
    expect(() => crearRol('  ')).toThrow(ErrorSemantico);
  });

  it('[rol] rechaza el mismo permiso dos veces', () => {
    const rol = crearRol();
    const permiso = crearPermiso('Crear plan');

    rol.asignarPermiso(permiso);

    expect(() => rol.asignarPermiso(permiso)).toThrow(ErrorSemantico);
    expect(rol.permisos.getItems()).toHaveLength(1);
  });

  it('[rol] el mismo permiso puede asignarse a dos roles', () => {
    const permiso = crearPermiso('Crear plan');
    const primero = crearRol('PROFESOR');
    const segundo = crearRol('Administrador');

    primero.asignarPermiso(permiso);
    segundo.asignarPermiso(permiso);

    expect(primero.permisos.getItems()).toHaveLength(1);
    expect(segundo.permisos.getItems()).toHaveLength(1);
  });

  it('[rol] asignar y quitar permisos no escriben auditoría', () => {
    const rol = crearRol();
    const permiso = crearPermiso('Crear plan');

    rol.asignarPermiso(permiso);
    rol.quitarPermiso(permiso);

    expect(rol.permisos.getItems()).toHaveLength(0);
    expect(rol.updatedAt).toBeNull();
    expect(rol.updatedById).toBeNull();
  });

  it('[rol] rechaza quitar un permiso que no tiene', () => {
    const rol = crearRol();
    const permiso = crearPermiso('Crear plan');

    expect(() => rol.quitarPermiso(permiso)).toThrow(ErrorSemantico);
  });

  it('[rol] deriva el estado activo de la baja lógica', () => {
    const rol = crearRol();

    expect(rol.estaActivo()).toBe(true);

    rol.deletedAt = edicion;

    expect(rol.estaActivo()).toBe(false);
  });
});
