import { describe, expect, it } from 'vitest';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

class PermisoRepositoryFalso implements IPermisoRepository {
  constructor(private readonly porNombre: Map<string, Permiso>) {}

  async save(): Promise<void> {
    throw new Error('la lectura no escribe');
  }

  async findByNombre(nombre: string): Promise<Permiso | null> {
    return this.porNombre.get(nombre) ?? null;
  }
}

function crearPermiso(nombre: string): Permiso {
  return { nombre } as Permiso;
}

describe('FindPermisoByNombreUseCase', () => {
  it('[find-permiso] recorta el nombre antes de buscar', async () => {
    const permiso = crearPermiso('Crear plan');
    const caso = new FindPermisoByNombreUseCase(
      new PermisoRepositoryFalso(new Map([[permiso.nombre, permiso]])),
    );

    await expect(caso.execute('  Crear plan  ')).resolves.toBe(permiso);
  });

  it('[find-permiso] devuelve null cuando el nombre no existe', async () => {
    const caso = new FindPermisoByNombreUseCase(new PermisoRepositoryFalso(new Map()));

    await expect(caso.execute('Inexistente')).resolves.toBeNull();
  });
});
