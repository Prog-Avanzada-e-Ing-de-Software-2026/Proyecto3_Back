import { beforeAll, describe, expect, it } from 'vitest';
import {
  RolRepositoryFalso,
  UsuarioRepositoryFalso,
} from '../../../../../test/support/fakes-auth.js';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';
import { CreateUsuarioUseCase } from './create-usuario.use-case.js';

beforeAll(() => {
  initOrmMetadata();
});

/** Doble del hasher: reversible y determinista, sin costo de argon2. */
class HasherFalso implements IPasswordHasher {
  async hash(claro: string): Promise<string> {
    return `hash:${claro}`;
  }

  async verify(hash: string, claro: string): Promise<boolean> {
    return hash === `hash:${claro}`;
  }
}

function armar(opciones: { rolVigente?: boolean } = {}) {
  const roles = new RolRepositoryFalso();
  const rol = Rol.crear({ nombre: 'Administrador' });
  rol.id = 1;

  if (opciones.rolVigente === false) {
    rol.deletedAt = new Date('2026-03-01T10:00:00.000Z');
  }

  roles.precargar(rol);
  const usuarios = new UsuarioRepositoryFalso();

  return { usuarios, caso: new CreateUsuarioUseCase(usuarios, roles, new HasherFalso()) };
}

describe('CreateUsuarioUseCase', () => {
  it('[identidad-usuario] crea el usuario con el rol resuelto y la credencial hasheada', async () => {
    const { usuarios, caso } = armar();

    const usuario = await caso.execute({
      email: '  Admin@Gym.com ',
      password: '30123456',
      rolNombre: 'Administrador',
    });

    expect(usuario.email).toBe('admin@gym.com');
    expect(usuario.rol.nombre).toBe('Administrador');
    expect(usuario.passwordHash).toBe('hash:30123456');
    expect(usuario.passwordHash).not.toBe('30123456');
    expect(usuario.createdById).toBeNull();
    expect(usuario.createdAt).toBeInstanceOf(Date);
    expect(usuarios).toBeDefined();
  });

  it('[identidad-usuario] rechaza un email que ya existe', async () => {
    const { caso } = armar();
    await caso.execute({
      email: 'admin@gym.com',
      password: '30123456',
      rolNombre: 'Administrador',
    });

    await expect(
      caso.execute({ email: 'ADMIN@gym.com', password: '30123456', rolNombre: 'Administrador' }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_DUPLICADO' });
  });

  it('[identidad-usuario] rechaza un rol inexistente', async () => {
    const { caso } = armar();

    await expect(
      caso.execute({ email: 'admin@gym.com', password: '30123456', rolNombre: 'Fantasma' }),
    ).rejects.toMatchObject({ codigo: 'ROL_NO_ENCONTRADO' });
  });

  it('[identidad-usuario] rechaza un rol dado de baja', async () => {
    const { caso } = armar({ rolVigente: false });

    await expect(
      caso.execute({ email: 'admin@gym.com', password: '30123456', rolNombre: 'Administrador' }),
    ).rejects.toMatchObject({ codigo: 'ROL_NO_ENCONTRADO' });
  });

  it('[identidad-usuario] rechaza una contraseña demasiado corta', async () => {
    const { caso } = armar();

    await expect(
      caso.execute({ email: 'admin@gym.com', password: 'corta', rolNombre: 'Administrador' }),
    ).rejects.toMatchObject({ codigo: 'CREDENCIAL_DEBIL' });
  });
});
