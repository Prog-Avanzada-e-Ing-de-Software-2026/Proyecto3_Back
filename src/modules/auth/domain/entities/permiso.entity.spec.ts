import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from './permiso.entity.js';

const edicion = new Date('2026-02-01T10:00:00.000Z');

function crearPermiso(nombre = 'Crear plan'): Permiso {
  return Permiso.crear({ nombre });
}

describe('Permiso', () => {
  it('[permiso] rechaza un nombre vacio', () => {
    expect(() => crearPermiso('   ')).toThrow(ErrorSemantico);
  });

  it('[permiso] recorta los espacios circundantes del nombre', () => {
    expect(crearPermiso('  Crear plan  ').nombre).toBe('Crear plan');
  });

  it('[permiso] el alta no escribe auditoría: la completa el caso de uso', () => {
    const permiso = crearPermiso();

    expect(permiso.createdAt).toBeUndefined();
    expect(permiso.updatedAt).toBeNull();
    expect(permiso.updatedById).toBeNull();
  });

  it('[permiso] deriva el estado activo de la baja lógica', () => {
    const permiso = crearPermiso();

    expect(permiso.estaActivo()).toBe(true);

    permiso.deletedAt = edicion;

    expect(permiso.estaActivo()).toBe(false);
  });
});
