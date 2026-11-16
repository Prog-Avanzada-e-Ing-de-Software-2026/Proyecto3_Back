import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../common/domain/errors/error-semantico.js';
import { CLAVE_RUTA_PUBLICA } from '../../../common/presentation/auth/public.decorator.js';
import type { SolicitudAutenticada } from '../../../common/presentation/auth/solicitud-autenticada.js';
import { Permiso } from '../domain/entities/permiso.entity.js';
import { Rol } from '../domain/entities/rol.entity.js';
import { Usuario } from '../domain/entities/usuario.entity.js';
import type { IUsuarioRepository } from '../domain/interfaces/usuario.repository.interface.js';
import { AuthGuard } from './auth.guard.js';
import { COOKIE_SESION } from './sesion.service.js';

const SECRETO = 'un-secreto-de-pruebas-con-longitud-suficiente';

class UsuarioRepositoryFalso implements IUsuarioRepository {
  constructor(private readonly usuarios: Usuario[] = []) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.email === email) ?? null;
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.id === id) ?? null;
  }
}

function crearUsuario(id: number): Usuario {
  const rol = Rol.crear({ nombre: 'Alumno', permisos: [Permiso.crear({ nombre: 'Crear plan' })] });
  const usuario = Usuario.crear({ email: `usuario${id}@gym.com`, passwordHash: 'hash', rol });
  usuario.id = id;

  return usuario;
}

function contexto(solicitud: Partial<SolicitudAutenticada>, publica = false): ExecutionContext {
  const handler = (): void => {};
  const clase = class Controlador {};

  if (publica) {
    Reflect.defineMetadata(CLAVE_RUTA_PUBLICA, true, handler);
  }

  return {
    getHandler: () => handler,
    getClass: () => clase,
    switchToHttp: () => ({
      getRequest: <T>() => solicitud as T,
    }),
  } as unknown as ExecutionContext;
}

function guard(usuarios: Usuario[] = [], jwt = new JwtService({ secret: SECRETO })): AuthGuard {
  return new AuthGuard(new Reflector(), jwt, new UsuarioRepositoryFalso(usuarios));
}

function conCookie(solicitud: Record<string, unknown>, token: string): Partial<SolicitudAutenticada> {
  return { ...solicitud, cookies: { [COOKIE_SESION]: token } };
}

describe('AuthGuard', () => {
  beforeAll(() => {
    initOrmMetadata();
  });

  it('[autenticacion-sesion] deja pasar una ruta pública sin token', async () => {
    await expect(guard().canActivate(contexto({}, true))).resolves.toBe(true);
  });

  it('[autenticacion-sesion] rechaza una petición sin cookie de sesión', async () => {
    await expect(guard().canActivate(contexto({}))).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un token vencido', async () => {
    const jwt = new JwtService({ secret: SECRETO });
    const vencido = await jwt.signAsync({ sub: 1 }, { expiresIn: '-1s' });

    await expect(
      guard([crearUsuario(1)], jwt).canActivate(contexto(conCookie({}, vencido))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un token firmado con otra clave', async () => {
    const ajeno = await new JwtService({ secret: 'otro-secreto-con-longitud-suficiente-distinto' }).signAsync(
      { sub: 1 },
    );

    await expect(
      guard([crearUsuario(1)]).canActivate(contexto(conCookie({}, ajeno))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[RN-34] rechaza la sesión de un usuario dado de baja', async () => {
    const usuario = crearUsuario(1);
    usuario.deletedAt = new Date('2026-03-01T10:00:00.000Z');
    const token = await new JwtService({ secret: SECRETO }).signAsync({ sub: 1 });

    await expect(
      guard([usuario]).canActivate(contexto(conCookie({}, token))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un token cuyo usuario ya no existe', async () => {
    const token = await new JwtService({ secret: SECRETO }).signAsync({ sub: 99 });

    await expect(guard().canActivate(contexto(conCookie({}, token)))).rejects.toBeInstanceOf(
      ErrorSemantico,
    );
  });

  it('[autenticacion-sesion] deja el actor de la sesión en la petición', async () => {
    const token = await new JwtService({ secret: SECRETO }).signAsync({ sub: 1 });
    const solicitud = conCookie({}, token);

    await expect(guard([crearUsuario(1)]).canActivate(contexto(solicitud))).resolves.toBe(true);
    expect(solicitud.actorId).toBe(1);
  });
});
