import { beforeAll, describe, expect, it } from 'vitest';
import { PermisoRepositoryFalso, RolRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';
import { ReplaceRolPermisosUseCase } from './replace-rol-permisos.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

const CREAR_PLAN = 'plan:crear';
const GESTIONAR_ALUMNOS = 'alumno:consultar';
const GESTIONAR_ROLES = 'rol:editar';

function armar(opciones: { permisosDelRol?: string[] } = {}) {
  const crearPlan = Permiso.crear({ nombre: CREAR_PLAN });
  const gestionarAlumnos = Permiso.crear({ nombre: GESTIONAR_ALUMNOS });
  const gestionarRoles = Permiso.crear({ nombre: GESTIONAR_ROLES });

  const permisos = new PermisoRepositoryFalso();
  permisos.precargar(crearPlan, gestionarAlumnos, gestionarRoles);

  const rol = Rol.crear({
    nombre: 'Entrenador',
    permisos: (opciones.permisosDelRol ?? []).map(
      (nombre) => permisos.guardados.find((permiso) => permiso.nombre === nombre) as Permiso,
    ),
  });
  rol.id = 1;
  rol.createdAt = new Date('2026-01-01T10:00:00.000Z');

  const roles = new RolRepositoryFalso();
  roles.precargar(rol);

  return {
    rol,
    roles,
    caso: new ReplaceRolPermisosUseCase(roles, new FindPermisoByNombreUseCase(permisos)),
  };
}

describe('ReplaceRolPermisosUseCase', () => {
  it('[identidad-usuario] deja el rol con exactamente el conjunto pedido', async () => {
    const { caso } = armar({ permisosDelRol: [CREAR_PLAN] });

    const rol = await caso.execute({
      id: 1,
      permisos: [GESTIONAR_ALUMNOS],
      actorId: 9,
    });

    expect(rol.permisos.getItems().map((permiso) => permiso.nombre)).toEqual([GESTIONAR_ALUMNOS]);
  });

  it('[identidad-usuario] agrega sin quitar lo que ya estaba cuando se pide conservarlo', async () => {
    const { caso } = armar({ permisosDelRol: [CREAR_PLAN] });

    const rol = await caso.execute({
      id: 1,
      permisos: [CREAR_PLAN, GESTIONAR_ALUMNOS],
      actorId: 9,
    });

    expect(
      rol.permisos
        .getItems()
        .map((permiso) => permiso.nombre)
        .sort(),
    ).toEqual([CREAR_PLAN, GESTIONAR_ALUMNOS].sort());
  });

  it('[identidad-usuario] asigna cualquier permiso vigente sin mirar los del actor', async () => {
    const { caso, rol } = armar({ permisosDelRol: [CREAR_PLAN] });

    const actualizado = await caso.execute({
      id: 1,
      permisos: [GESTIONAR_ALUMNOS],
      actorId: 9,
    });

    expect(actualizado.permisos.getItems().map((permiso) => permiso.nombre)).toEqual([
      GESTIONAR_ALUMNOS,
    ]);
    expect(rol.updatedById).toBe(9);
  });

  it('[identidad-usuario] registra la edición con su actor', async () => {
    const { caso } = armar();

    const rol = await caso.execute({ id: 1, permisos: [], actorId: 9 });

    expect(rol.updatedById).toBe(9);
    expect(rol.updatedAt).toBeInstanceOf(Date);
  });

  it('[identidad-usuario] rechaza un permiso inexistente sin tocar el conjunto', async () => {
    const { caso, rol } = armar({ permisosDelRol: [CREAR_PLAN] });

    await expect(
      caso.execute({ id: 1, permisos: ['Inexistente'], actorId: 9 }),
    ).rejects.toMatchObject({ codigo: 'PERMISO_NO_ENCONTRADO' });
    expect(rol.permisos.getItems().map((permiso) => permiso.nombre)).toEqual([CREAR_PLAN]);
  });

  it('[identidad-usuario] rechaza un permiso repetido en el pedido', async () => {
    const { caso } = armar();

    await expect(
      caso.execute({ id: 1, permisos: [CREAR_PLAN, CREAR_PLAN], actorId: 9 }),
    ).rejects.toMatchObject({ codigo: 'PERMISO_DUPLICADO' });
  });

  it('[identidad-usuario] rechaza un rol inexistente', async () => {
    const { caso } = armar();

    await expect(caso.execute({ id: 99, permisos: [], actorId: 9 })).rejects.toMatchObject({
      codigo: 'ROL_NO_ENCONTRADO',
    });
  });
});
