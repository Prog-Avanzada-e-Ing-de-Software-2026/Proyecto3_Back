import { describe, expect, it } from 'vitest';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { FindPermisoByCodigoUseCase } from './find-permiso-by-codigo.use-case.js';

class PermisoRepositoryFalso implements IPermisoRepository {
  constructor(private readonly porCodigo: Map<string, Permiso>) {}

  async save(): Promise<void> {
    throw new Error('la lectura no escribe');
  }

  async findByCodigo(codigo: string): Promise<Permiso | null> {
    return this.porCodigo.get(codigo) ?? null;
  }
}

function crearPermiso(codigo: string): Permiso {
  return { codigo } as Permiso;
}

describe('FindPermisoByCodigoUseCase', () => {
  it('[find-permiso] normaliza el código antes de buscar', async () => {
    const permiso = crearPermiso('CREAR_PLAN');
    const caso = new FindPermisoByCodigoUseCase(
      new PermisoRepositoryFalso(new Map([[permiso.codigo, permiso]])),
    );

    await expect(caso.execute('  crear_plan  ')).resolves.toBe(permiso);
  });

  it('[find-permiso] devuelve null cuando el código no existe', async () => {
    const caso = new FindPermisoByCodigoUseCase(new PermisoRepositoryFalso(new Map()));

    await expect(caso.execute('INEXISTENTE')).resolves.toBeNull();
  });
});
