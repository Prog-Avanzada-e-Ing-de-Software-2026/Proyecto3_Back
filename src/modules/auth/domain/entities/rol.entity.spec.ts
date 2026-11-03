import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from './permiso.entity.js';
import { Rol } from './rol.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');
const edicion = new Date('2026-02-01T10:00:00.000Z');

beforeAll(() => {
  initOrmMetadata();
});

function crearPermiso(codigo: string): Permiso {
  return Permiso.crear({
    codigo,
    nombre: codigo,
    createdAt: alta,
    createdById: null,
  });
}

function crearRol(codigo = 'PROFESOR'): Rol {
  return Rol.crear({
    codigo,
    nombre: codigo,
    createdAt: alta,
    createdById: null,
  });
}

describe('Rol', () => {
  it('[rol] un rol sin permisos es valido', () => {
    const rol = crearRol();

    expect(rol.permisos.getItems()).toHaveLength(0);
    expect(rol.codigo).toBe('PROFESOR');
  });

  it('[rol] normaliza el codigo a mayusculas', () => {
    expect(crearRol('  profesor  ').codigo).toBe('PROFESOR');
  });

  it('[rol] rechaza un codigo vacio', () => {
    expect(() => crearRol('  ')).toThrow(ErrorSemantico);
  });

  it('[rol] rechaza el mismo permiso dos veces', () => {
    const rol = crearRol();
    const permiso = crearPermiso('CREAR_PLAN');

    rol.asignarPermiso(permiso, 7, edicion);

    expect(() => rol.asignarPermiso(permiso, 7, edicion)).toThrow(ErrorSemantico);
    expect(rol.permisos.getItems()).toHaveLength(1);
  });

  it('[rol] el mismo permiso puede asignarse a dos roles', () => {
    const permiso = crearPermiso('CREAR_PLAN');
    const primero = crearRol('PROFESOR');
    const segundo = crearRol('ADMINISTRADOR');

    primero.asignarPermiso(permiso, 7, edicion);
    segundo.asignarPermiso(permiso, 7, edicion);

    expect(primero.permisos.getItems()).toHaveLength(1);
    expect(segundo.permisos.getItems()).toHaveLength(1);
  });

  it('[rol] asignar y quitar permisos actualiza el ultimo responsable del rol', () => {
    const rol = crearRol();
    const permiso = crearPermiso('CREAR_PLAN');

    rol.asignarPermiso(permiso, 7, edicion);

    expect(rol.updatedAt).toBe(edicion);
    expect(rol.updatedById).toBe(7);
    expect(rol.ultimoResponsableId).toBe(7);

    const remocion = new Date('2026-03-01T10:00:00.000Z');
    rol.quitarPermiso(permiso, 8, remocion);

    expect(rol.permisos.getItems()).toHaveLength(0);
    expect(rol.updatedAt).toBe(remocion);
    expect(rol.updatedById).toBe(8);
  });

  it('[rol] rechaza quitar un permiso que no tiene', () => {
    const rol = crearRol();
    const permiso = crearPermiso('CREAR_PLAN');

    expect(() => rol.quitarPermiso(permiso, 7, edicion)).toThrow(ErrorSemantico);
  });

  it('[rol] exige actor para modificar la asignacion', () => {
    const rol = crearRol();
    const permiso = crearPermiso('CREAR_PLAN');

    expect(() => rol.asignarPermiso(permiso, undefined as unknown as number, edicion)).toThrow(
      ErrorSemantico,
    );
    expect(rol.permisos.getItems()).toHaveLength(0);
  });

  it('[rol] aplica la baja logica y la reactivacion como cualquier entidad auditada', () => {
    const rol = crearRol();

    rol.darDeBaja(7, edicion);

    expect(rol.estaActivo()).toBe(false);
    expect(rol.deletedAt).toBe(edicion);
    expect(rol.deletedById).toBe(7);

    rol.reactivar(8, edicion);

    expect(rol.estaActivo()).toBe(true);
    expect(rol.deletedAt).toBeNull();
    expect(rol.deletedById).toBeNull();
  });
});
