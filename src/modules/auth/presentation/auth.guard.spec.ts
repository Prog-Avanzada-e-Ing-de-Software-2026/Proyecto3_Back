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
import { COOKIE_ACCESS, SesionService } from './sesion.service.js';

const SECRETO_ACCESS = 'un-secreto-de-pruebas-access-con-longitud-suficiente';
const SECRETO_REFRESH = 'un-secreto-de-pruebas-refresh-con-longitud-suficiente';

const CONFIGURACION = {
  secretoAccess: SECRETO_ACCESS,
  secretoRefresh: SECRETO_REFRESH,
  ttlAccess: 900,
  ttlRefresh: 604_800,
};

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

function guard(usuarios: Usuario[] = []): AuthGuard {
  return new AuthGuard(
    new Reflector(),
    new SesionService(new JwtService({}), CONFIGURACION),
    new UsuarioRepositoryFalso(usuarios),
  );
}

function conCookie(
  solicitud: Record<string, unknown>,
  token: string,
  nombre: string = COOKIE_ACCESS,
): Partial<SolicitudAutenticada> {
  return { ...solicitud, cookies: { [nombre]: token } };
}

function firmar(
  contenido: Record<string, unknown>,
  opciones: { secreto?: string; expiresIn?: number } = {},
): Promise<string> {
  const servicio = new JwtService({});
  const secreto = opciones.secreto ?? SECRETO_ACCESS;

  return opciones.expiresIn === undefined
    ? servicio.signAsync(contenido, { secret: secreto })
    : servicio.signAsync(contenido, { secret: secreto, expiresIn: opciones.expiresIn });
}

describe('AuthGuard', () => {
  beforeAll(() => {
    initOrmMetadata();
  });

  it('[autenticacion-sesion] deja pasar una ruta pública sin token', async () => {
    await expect(guard().canActivate(contexto({}, true))).resolves.toBe(true);
  });

  it('[autenticacion-sesion] rechaza una petición sin cookie de access', async () => {
    await expect(guard().canActivate(contexto({}))).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un access vencido', async () => {
    const vencido = await firmar({ sub: 1, tipo: 'access' }, { expiresIn: -1 });

    await expect(
      guard([crearUsuario(1)]).canActivate(contexto(conCookie({}, vencido))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un token firmado con otra clave', async () => {
    const ajeno = await firmar(
      { sub: 1, tipo: 'access' },
      { secreto: 'un-secreto-ajeno-con-longitud-suficiente-y-distinto' },
    );

    await expect(
      guard([crearUsuario(1)]).canActivate(contexto(conCookie({}, ajeno))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un refresh presentado como access', async () => {
    const refresh = await firmar({ sub: 1, tipo: 'refresh' }, { secreto: SECRETO_REFRESH });

    await expect(
      guard([crearUsuario(1)]).canActivate(contexto(conCookie({}, refresh))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[RN-34] rechaza la sesión de un usuario dado de baja', async () => {
    const usuario = crearUsuario(1);
    usuario.deletedAt = new Date('2026-03-01T10:00:00.000Z');
    const token = await firmar({ sub: 1, tipo: 'access' });

    await expect(
      guard([usuario]).canActivate(contexto(conCookie({}, token))),
    ).rejects.toBeInstanceOf(ErrorSemantico);
  });

  it('[autenticacion-sesion] rechaza un token cuyo usuario ya no existe', async () => {
    const token = await firmar({ sub: 99, tipo: 'access' });

    await expect(guard().canActivate(contexto(conCookie({}, token)))).rejects.toBeInstanceOf(
      ErrorSemantico,
    );
  });

  it('[autenticacion-sesion] deja el actor de la sesión en la petición', async () => {
    const token = await firmar({ sub: 1, tipo: 'access' });
    const solicitud = conCookie({}, token);

    await expect(guard([crearUsuario(1)]).canActivate(contexto(solicitud))).resolves.toBe(true);
    expect(solicitud.actorId).toBe(1);
  });
});
