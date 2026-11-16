import { beforeAll, describe, expect, it } from 'vitest';
import { PermisoRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { CreatePermisoUseCase } from './create-permiso.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

describe('CreatePermisoUseCase', () => {
  it('[identidad-usuario] crea el permiso con el nombre normalizado y el actor', async () => {
    const repositorio = new PermisoRepositoryFalso();

    const permiso = await new CreatePermisoUseCase(repositorio).execute({
      nombre: '  Crear plan  ',
      actorId: 7,
    });

    expect(repositorio.guardados).toHaveLength(1);
    expect(permiso.nombre).toBe('Crear plan');
    expect(permiso.descripcion).toBeNull();
    expect(permiso.createdById).toBe(7);
    expect(permiso.createdAt).toBeInstanceOf(Date);
    expect(permiso.updatedAt).toBeNull();
  });

  it('[identidad-usuario] rechaza un nombre que ya existe', async () => {
    const repositorio = new PermisoRepositoryFalso();
    repositorio.precargar(Permiso.crear({ nombre: 'Crear plan' }));

    await expect(
      new CreatePermisoUseCase(repositorio).execute({ nombre: ' Crear plan ' }),
    ).rejects.toMatchObject({ codigo: 'PERMISO_DUPLICADO' });
    expect(repositorio.guardados).toHaveLength(1);
  });

  it('[identidad-usuario] rechaza el nombre vacío sin escribir', async () => {
    const repositorio = new PermisoRepositoryFalso();

    await expect(
      new CreatePermisoUseCase(repositorio).execute({ nombre: '   ' }),
    ).rejects.toThrow();
    expect(repositorio.guardados).toHaveLength(0);
  });
});
