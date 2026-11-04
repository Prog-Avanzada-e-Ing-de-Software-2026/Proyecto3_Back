import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from './permiso.entity.js';

const alta = new Date('2026-01-01T10:00:00.000Z');
const edicion = new Date('2026-02-01T10:00:00.000Z');

function crearPermiso(nombre = 'Crear plan'): Permiso {
  return Permiso.crear({
    nombre,
    createdAt: alta,
    createdById: null,
  });
}

describe('Permiso', () => {
  it('[permiso] rechaza un nombre vacio', () => {
    expect(() => crearPermiso('   ')).toThrow(ErrorSemantico);
  });

  it('[permiso] recorta los espacios circundantes del nombre', () => {
    expect(crearPermiso('  Crear plan  ').nombre).toBe('Crear plan');
  });

  it('[permiso] rechaza un nombre vacio en la construccion directa', () => {
    expect(() =>
      Permiso.crear({
        nombre: ' ',
        createdAt: alta,
        createdById: null,
      }),
    ).toThrow(ErrorSemantico);
  });

  it('[permiso] completa la auditoria del alta con el momento recibido', () => {
    const permiso = crearPermiso();

    expect(permiso.createdAt).toBe(alta);
    expect(permiso.createdById).toBeNull();
    expect(permiso.updatedAt).toBeNull();
    expect(permiso.updatedById).toBeNull();
    expect(permiso.estaActivo()).toBe(true);
  });

  it('[permiso] exige actor y momento para la baja', () => {
    const permiso = crearPermiso();

    expect(() => permiso.darDeBaja(undefined as unknown as number, edicion)).toThrow(ErrorSemantico);
    expect(permiso.estaActivo()).toBe(true);
    expect(permiso.deletedAt).toBeNull();
    expect(permiso.deletedById).toBeNull();
  });

  it('[permiso] escribe fecha y autor de baja juntos y actualiza el ultimo responsable', () => {
    const permiso = crearPermiso();

    permiso.darDeBaja(7, edicion);

    expect(permiso.estaActivo()).toBe(false);
    expect(permiso.deletedAt).toBe(edicion);
    expect(permiso.deletedById).toBe(7);
    expect(permiso.updatedAt).toBe(edicion);
    expect(permiso.updatedById).toBe(7);
    expect(permiso.ultimoResponsableId).toBe(7);
  });

  it('[permiso] rechaza dar de baja dos veces', () => {
    const permiso = crearPermiso();
    permiso.darDeBaja(7, edicion);

    expect(() => permiso.darDeBaja(8, edicion)).toThrow(ErrorSemantico);
  });

  it('[permiso] la reactivacion limpia la baja y conserva el resto del registro', () => {
    const permiso = crearPermiso();
    permiso.darDeBaja(7, edicion);

    const reactivacion = new Date('2026-03-01T10:00:00.000Z');
    permiso.reactivar(9, reactivacion);

    expect(permiso.estaActivo()).toBe(true);
    expect(permiso.deletedAt).toBeNull();
    expect(permiso.deletedById).toBeNull();
    expect(permiso.nombre).toBe('Crear plan');
    expect(permiso.createdAt).toBe(alta);
    expect(permiso.updatedAt).toBe(reactivacion);
    expect(permiso.updatedById).toBe(9);
  });

  it('[permiso] rechaza reactivar un registro activo', () => {
    const permiso = crearPermiso();

    expect(() => permiso.reactivar(9, edicion)).toThrow(ErrorSemantico);
  });

  it('[permiso] el ultimo responsable es el editor cuando hubo edicion', () => {
    const permiso = Permiso.crear({
      nombre: 'Crear plan',
      createdAt: alta,
      createdById: 3,
    });

    expect(permiso.ultimoResponsableId).toBe(3);

    permiso.registrarEdicion(4, edicion);

    expect(permiso.ultimoResponsableId).toBe(4);
    expect(permiso.createdById).toBe(3);
    expect(permiso.createdAt).toBe(alta);
  });
});
