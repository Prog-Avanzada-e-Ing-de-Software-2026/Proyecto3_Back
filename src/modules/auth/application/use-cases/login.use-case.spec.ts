import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { UsuarioRepositoryFalso } from '../../../../../test/support/fakes-auth.js';
import { CredencialesInvalidasError } from '../../domain/errors/credenciales-invalidas.error.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';
import { LoginUseCase } from './login.use-case.js';

/** Doble del hasher: la contraseña correcta es la que produjo el hash. */
class HasherFalso implements IPasswordHasher {
  async hash(claro: string): Promise<string> {
    return `hash:${claro}`;
  }

  async verify(hash: string, claro: string): Promise<boolean> {
    return hash === `hash:${claro}`;
  }
}

function crearPermiso(nombre: string): Permiso {
  return Permiso.crear({ nombre });
}

function crearRol(nombre: string, nombresPermisos: string[] = []): Rol {
  const permisos = nombresPermisos.map((nombrePermiso) => crearPermiso(nombrePermiso));

  return Rol.crear({ nombre, permisos });
}

function crearUsuario(id: number, rol: Rol, passwordHash = 'hash:30123456'): Usuario {
  const usuario = Usuario.crear({ email: 'Alumno@Gym.com', passwordHash, rol });
  usuario.id = id;

  return usuario;
}

describe('LoginUseCase', () => {
  beforeAll(() => {
    initOrmMetadata();
  });

  function armar(usuario: Usuario | null): LoginUseCase {
    const usuarios = new UsuarioRepositoryFalso();

    if (usuario !== null) {
      usuarios.precargar(usuario);
    }

    return new LoginUseCase(usuarios, new HasherFalso());
  }

  it('[identidad-usuario] concede la sesión y devuelve rol y permisos efectivos', async () => {
    const rol = crearRol('Profesor', ['Crear plan']);
    const caso = armar(crearUsuario(7, rol));

    const resultado = await caso.execute({ email: 'alumno@gym.com', password: '30123456' });

    expect(resultado).toEqual({
      id: 7,
      email: 'alumno@gym.com',
      rol: 'Profesor',
      permisos: ['Crear plan'],
    });
  });

  it('[identidad-usuario] normaliza el email antes de buscar', async () => {
    const caso = armar(crearUsuario(7, crearRol('Alumno')));

    const resultado = await caso.execute({ email: '  ALUMNO@GYM.COM  ', password: '30123456' });

    expect(resultado.email).toBe('alumno@gym.com');
  });

  it('[identidad-usuario] rechaza una contraseña incorrecta', async () => {
    const caso = armar(crearUsuario(7, crearRol('Alumno')));

    await expect(caso.execute({ email: 'alumno@gym.com', password: 'otra' })).rejects.toBeInstanceOf(
      CredencialesInvalidasError,
    );
  });

  it('[identidad-usuario] rechaza un email inexistente con la misma excepción', async () => {
    const caso = armar(null);

    await expect(
      caso.execute({ email: 'nadie@gym.com', password: '30123456' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('[RN-34] rechaza a un usuario dado de baja', async () => {
    const usuario = crearUsuario(7, crearRol('Alumno'));
    usuario.deletedAt = new Date('2026-03-01T10:00:00.000Z');

    await expect(
      armar(usuario).execute({ email: 'alumno@gym.com', password: '30123456' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('[identidad-usuario] rechaza a un usuario cuyo rol está dado de baja', async () => {
    const rol = crearRol('Alumno');
    rol.deletedAt = new Date('2026-03-01T10:00:00.000Z');

    await expect(
      armar(crearUsuario(7, rol)).execute({ email: 'alumno@gym.com', password: '30123456' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('[identidad-usuario] no devuelve permisos dados de baja', async () => {
    const vigente = crearPermiso('Crear plan');
    const dadoDeBaja = crearPermiso('Gestionar alumnos');
    dadoDeBaja.deletedAt = new Date('2026-03-01T10:00:00.000Z');
    const rol = Rol.crear({ nombre: 'Profesor', permisos: [vigente, dadoDeBaja] });

    const resultado = await armar(crearUsuario(7, rol)).execute({
      email: 'alumno@gym.com',
      password: '30123456',
    });

    expect(resultado.permisos).toEqual(['Crear plan']);
  });
});
