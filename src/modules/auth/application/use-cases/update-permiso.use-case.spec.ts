import { beforeAll, describe, expect, it } from 'vitest';
import { PermisoRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { UpdatePermisoUseCase } from './update-permiso.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

function permisoGuardado(nombre: string, id = 1): Permiso {
  const permiso = Permiso.crear({ nombre });
  permiso.id = id;
  permiso.createdAt = new Date('2026-01-01T10:00:00.000Z');

  return permiso;
}

describe('UpdatePermisoUseCase', () => {
  it('[identidad-usuario] edita nombre y descripción y registra la edición', async () => {
    const permisos = new PermisoRepositoryFalso();
    permisos.precargar(permisoGuardado('Gestionar materiales'));

    const permiso = await new UpdatePermisoUseCase(permisos).execute({
      id: 1,
      nombre: 'Gestionar material',
      descripcion: 'Alta y baja de material',
      actorId: 3,
    });

    expect(permiso.nombre).toBe('Gestionar material');
    expect(permiso.descripcion).toBe('Alta y baja de material');
    expect(permiso.updatedById).toBe(3);
  });

  it('[identidad-usuario] rechaza renombrar un permiso requerido', async () => {
    const permisos = new PermisoRepositoryFalso();
    permisos.precargar(permisoGuardado('Crear plan'));

    await expect(
      new UpdatePermisoUseCase(permisos).execute({ id: 1, nombre: 'Armar plan' }),
    ).rejects.toMatchObject({ codigo: 'NOMBRE_REQUERIDO' });
  });

  it('[identidad-usuario] rechaza un nombre que ya usa otro permiso', async () => {
    const permisos = new PermisoRepositoryFalso();
    permisos.precargar(
      permisoGuardado('Gestionar materiales', 1),
      permisoGuardado('Gestionar unidades', 2),
    );

    await expect(
      new UpdatePermisoUseCase(permisos).execute({ id: 1, nombre: 'Gestionar unidades' }),
    ).rejects.toMatchObject({ codigo: 'PERMISO_DUPLICADO' });
  });

  it('[identidad-usuario] rechaza un permiso inexistente', async () => {
    await expect(
      new UpdatePermisoUseCase(new PermisoRepositoryFalso()).execute({ id: 99 }),
    ).rejects.toMatchObject({ codigo: 'PERMISO_NO_ENCONTRADO' });
  });
});
