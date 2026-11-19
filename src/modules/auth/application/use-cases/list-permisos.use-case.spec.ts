import { describe, expect, it } from 'vitest';
import { PermisoRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { FindPermisoByIdUseCase } from './find-permiso-by-id.use-case.js';
import { ListPermisosUseCase } from './list-permisos.use-case.js';

function permisoGuardado(nombre: string, id: number): Permiso {
  const permiso = Permiso.crear({ nombre });
  permiso.id = id;
  permiso.createdAt = new Date('2026-01-01T10:00:00.000Z');

  return permiso;
}

// Listado y detalle comparten agregado y proyección: van juntos para no
// duplicar el armado del permiso en dos archivos.
describe('lecturas de permisos', () => {
  it('[identidad-usuario] el listado devuelve los permisos vigentes', async () => {
    const permisos = new PermisoRepositoryFalso();
    permisos.precargar(
      permisoGuardado('plan:crear', 1),
      permisoGuardado('rol:editar', 2),
    );

    await expect(new ListPermisosUseCase(permisos).execute()).resolves.toEqual([
      { id: 1, nombre: 'plan:crear', descripcion: null },
      { id: 2, nombre: 'rol:editar', descripcion: null },
    ]);
  });

  it('[identidad-usuario] el detalle devuelve el permiso pedido', async () => {
    const permisos = new PermisoRepositoryFalso();
    permisos.precargar(permisoGuardado('plan:crear', 5));

    await expect(new FindPermisoByIdUseCase(permisos).execute(5)).resolves.toEqual({
      id: 5,
      nombre: 'plan:crear',
      descripcion: null,
    });
  });

  it('[identidad-usuario] el detalle de un permiso inexistente responde no encontrado', async () => {
    await expect(
      new FindPermisoByIdUseCase(new PermisoRepositoryFalso()).execute(99),
    ).rejects.toMatchObject({ codigo: 'PERMISO_NO_ENCONTRADO' });
  });
});
