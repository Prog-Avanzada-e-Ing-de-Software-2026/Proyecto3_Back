import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { CreatePermisoUseCase } from './create-permiso.use-case.js';

class PermisoRepositoryFalso implements IPermisoRepository {
  readonly guardados: Permiso[] = [];
  private readonly porNombre = new Map<string, Permiso>();

  async save(permiso: Permiso): Promise<void> {
    this.guardados.push(permiso);
    this.porNombre.set(permiso.nombre, permiso);
  }

  async findByNombre(nombre: string): Promise<Permiso | null> {
    return this.porNombre.get(nombre) ?? null;
  }

  precargar(permiso: Permiso): void {
    this.porNombre.set(permiso.nombre, permiso);
  }
}

beforeAll(() => {
  initOrmMetadata();
});

describe('CreatePermisoUseCase', () => {
  it('[create-permiso] crea el permiso cuando el nombre no existe', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const caso = new CreatePermisoUseCase(repositorio);

    const permiso = await caso.execute({ nombre: '  Crear plan  ' });

    expect(repositorio.guardados).toHaveLength(1);
    expect(permiso.nombre).toBe('Crear plan');
    expect(permiso.descripcion).toBeNull();
    expect(permiso.createdById).toBeNull();
    expect(permiso.createdAt).toBeInstanceOf(Date);
    expect(permiso.updatedAt).toBeNull();
  });

  it('[create-permiso] no escribe cuando el nombre ya existe', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const caso = new CreatePermisoUseCase(repositorio);
    const existente = await caso.execute({ nombre: 'Crear plan' });
    const guardadosAntes = repositorio.guardados.length;

    const resultado = await caso.execute({
      nombre: '  Crear plan  ',
      descripcion: 'Otra descripción',
    });

    expect(resultado).toBe(existente);
    expect(repositorio.guardados).toHaveLength(guardadosAntes);
  });

  it('[create-permiso] rechaza el nombre vacío sin escribir', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const caso = new CreatePermisoUseCase(repositorio);

    await expect(caso.execute({ nombre: '  ' })).rejects.toThrow(ErrorSemantico);
    expect(repositorio.guardados).toHaveLength(0);
  });
});
