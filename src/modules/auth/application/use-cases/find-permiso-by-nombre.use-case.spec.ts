import { describe, expect, it } from 'vitest';
import { PermisoRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

describe('FindPermisoByNombreUseCase', () => {
  it('[identidad-usuario] recorta el nombre antes de buscar', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const permiso = Permiso.crear({ nombre: 'Crear plan' });
    repositorio.precargar(permiso);

    await expect(
      new FindPermisoByNombreUseCase(repositorio).execute('  Crear plan  '),
    ).resolves.toBe(permiso);
  });

  it('[identidad-usuario] devuelve null cuando el nombre no existe', async () => {
    await expect(
      new FindPermisoByNombreUseCase(new PermisoRepositoryFalso()).execute('Inexistente'),
    ).resolves.toBeNull();
  });
});
