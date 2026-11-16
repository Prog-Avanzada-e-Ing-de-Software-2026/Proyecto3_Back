import { beforeAll, describe, expect, it } from 'vitest';
import { RolRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import { UpdateRolUseCase } from './update-rol.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

function rolGuardado(nombre: string, id = 1): Rol {
  const rol = Rol.crear({ nombre });
  rol.id = id;
  rol.createdAt = new Date('2026-01-01T10:00:00.000Z');

  return rol;
}

describe('UpdateRolUseCase', () => {
  it('[identidad-usuario] edita nombre y descripción y registra la edición', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Entrenador'));

    const rol = await new UpdateRolUseCase(roles).execute({
      id: 1,
      nombre: 'Coach',
      descripcion: 'Acompaña alumnos',
      actorId: 5,
    });

    expect(rol.nombre).toBe('Coach');
    expect(rol.descripcion).toBe('Acompaña alumnos');
    expect(rol.updatedById).toBe(5);
    expect(rol.updatedAt).toBeInstanceOf(Date);
  });

  it('[identidad-usuario] rechaza renombrar un rol requerido', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Administrador'));

    await expect(
      new UpdateRolUseCase(roles).execute({ id: 1, nombre: 'Admin' }),
    ).rejects.toMatchObject({ codigo: 'NOMBRE_REQUERIDO' });
  });

  it('[identidad-usuario] acepta cambiar la descripción de un rol requerido', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Profesor'));

    const rol = await new UpdateRolUseCase(roles).execute({ id: 1, descripcion: 'Da clases' });

    expect(rol.nombre).toBe('Profesor');
    expect(rol.descripcion).toBe('Da clases');
  });

  it('[identidad-usuario] rechaza un nombre que ya usa otro rol', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Entrenador', 1), rolGuardado('Coach', 2));

    await expect(
      new UpdateRolUseCase(roles).execute({ id: 1, nombre: 'Coach' }),
    ).rejects.toMatchObject({ codigo: 'ROL_DUPLICADO' });
  });

  it('[identidad-usuario] acepta dejar el mismo nombre', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Entrenador'));

    await expect(
      new UpdateRolUseCase(roles).execute({ id: 1, nombre: 'Entrenador' }),
    ).resolves.toBeDefined();
  });

  it('[identidad-usuario] rechaza una edición sin campos y no escribe', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Entrenador'));
    const antes = roles.guardados[0]?.updatedAt ?? null;

    await expect(new UpdateRolUseCase(roles).execute({ id: 1 })).rejects.toMatchObject({
      codigo: 'SIN_CAMBIOS',
    });

    expect(roles.guardados[0]?.updatedAt).toBe(antes);
  });

  it('[identidad-usuario] acepta limpiar la descripción con null', async () => {
    const roles = new RolRepositoryFalso();
    roles.precargar(rolGuardado('Entrenador'));

    const rol = await new UpdateRolUseCase(roles).execute({ id: 1, descripcion: null });

    expect(rol.descripcion).toBeNull();
    expect(rol.updatedAt).toBeInstanceOf(Date);
  });

  it('[identidad-usuario] rechaza un rol inexistente', async () => {
    await expect(
      new UpdateRolUseCase(new RolRepositoryFalso()).execute({ id: 99, nombre: 'Otro' }),
    ).rejects.toMatchObject({ codigo: 'ROL_NO_ENCONTRADO' });
  });
});
