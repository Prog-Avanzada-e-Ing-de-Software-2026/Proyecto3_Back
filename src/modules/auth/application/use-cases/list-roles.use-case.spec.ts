import { beforeAll, describe, expect, it } from 'vitest';
import { RolRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import { FindRolByIdUseCase } from './find-rol-by-id.use-case.js';
import { ListRolesUseCase } from './list-roles.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

function rolGuardado(nombre: string, id: number, permisos: string[] = []): Rol {
  const rol = Rol.crear({
    nombre,
    permisos: permisos.map((nombrePermiso) => Permiso.crear({ nombre: nombrePermiso })),
  });
  rol.id = id;
  rol.createdAt = new Date('2026-01-01T10:00:00.000Z');

  return rol;
}

// Listado y detalle comparten agregado y proyección: van juntos para no
// duplicar el armado del rol en dos archivos.
describe('lecturas de roles', () => {
  it('[identidad-usuario] el listado devuelve los roles con sus permisos', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(
      rolGuardado('Administrador', 1, ['rol:editar']),
      rolGuardado('Alumno', 2),
    );

    const resumenes = await new ListRolesUseCase(roles).execute();

    expect(resumenes).toEqual([
      { id: 1, nombre: 'Administrador', descripcion: null, permisos: ['rol:editar'] },
      { id: 2, nombre: 'Alumno', descripcion: null, permisos: [] },
    ]);
  });

  it('[identidad-usuario] el detalle devuelve el rol pedido', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Profesor', 3, ['plan:crear']));

    const resumen = await new FindRolByIdUseCase(roles).execute(3);

    expect(resumen).toEqual({
      id: 3,
      nombre: 'Profesor',
      descripcion: null,
      permisos: ['plan:crear'],
    });
  });

  it('[identidad-usuario] el detalle de un rol inexistente responde no encontrado', async () => {
    await expect(
      new FindRolByIdUseCase(new RolRepositoryFalso()).execute(99),
    ).rejects.toMatchObject({ codigo: 'ROL_NO_ENCONTRADO' });
  });
});
