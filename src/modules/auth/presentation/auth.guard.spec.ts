import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../test/support/orm-metadata.js';
import { UsuarioRepositoryFalso } from '../../../../test/support/fakes-auth.js';
import { ErrorSemantico } from '../../../common/domain/errors/error-semantico.js';
import { CLAVE_RUTA_PUBLICA } from '../../../common/presentation/auth/public.decorator.js';
import { CLAVE_PERMISO } from '../../../common/presentation/auth/requiere-permiso.decorator.js';
import type { SolicitudAutenticada } from '../../../common/presentation/auth/solicitud-autenticada.js';
import { FindUsuarioByIdUseCase } from '../application/use-cases/find-usuario-by-id.use-case.js';
import { Permiso } from '../domain/entities/permiso.entity.js';
import { Rol } from '../domain/entities/rol.entity.js';
import { Usuario } from '../domain/entities/usuario.entity.js';
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

function crearUsuario(id: number): Usuario {
  const rol = Rol.crear({ nombre: 'Alumno', permisos: [Permiso.crear({ nombre: 'plan:crear' })] });
  const usuario = Usuario.crear({ email: `usuario${id}@gym.com`, passwordHash: 'hash', rol });
  usuario.id = id;

  return usuario;
}

function contexto(
  solicitud: Partial<SolicitudAutenticada>,
  opciones: { publica?: boolean; permiso?: string } = {},
): ExecutionContext {
  const handler = (): void => {};
  const clase = class Controlador {};

  if (opciones.publica === true) {
    Reflect.defineMetadata(CLAVE_RUTA_PUBLICA, true, handler);
  }

  if (opciones.permiso !== undefined) {
    Reflect.defineMetadata(CLAVE_PERMISO, opciones.permiso, handler);
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
    new FindUsuarioByIdUseCase(new UsuarioRepositoryFalso(usuarios)),
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
    await expect(guard().canActivate(contexto({}, { publica: true }))).resolves.toBe(true);
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
    expect(solicitud.usuario?.id).toBe(1);
  });
  it('[identidad-usuario] deja pasar una operación que no declara permiso', async () => {
    const token = await firmar({ sub: 1, tipo: 'access' });

    await expect(
      guard([crearUsuario(1)]).canActivate(contexto(conCookie({}, token))),
    ).resolves.toBe(true);
  });

  it('[identidad-usuario] deja pasar cuando el usuario tiene el permiso declarado', async () => {
    const token = await firmar({ sub: 1, tipo: 'access' });

    await expect(
      guard([crearUsuario(1)]).canActivate(
        contexto(conCookie({}, token), { permiso: 'plan:crear' }),
      ),
    ).resolves.toBe(true);
  });

  it('[identidad-usuario] rechaza con prohibido cuando falta el permiso declarado', async () => {
    const token = await firmar({ sub: 1, tipo: 'access' });

    await expect(
      guard([crearUsuario(1)]).canActivate(
        contexto(conCookie({}, token), { permiso: 'alumno:consultar' }),
      ),
    ).rejects.toMatchObject({ categoria: 'prohibido', codigo: 'SIN_PERMISO' });
  });

  it('[identidad-usuario] responde 401 antes de evaluar permisos si no hay sesión', async () => {
    await expect(
      guard().canActivate(contexto({}, { permiso: 'alumno:consultar' })),
    ).rejects.toMatchObject({ categoria: 'no_autenticado', codigo: 'SESION_INVALIDA' });
  });

  it('[identidad-usuario] una ruta pública no evalúa permisos aunque los declare', async () => {
    await expect(
      guard().canActivate(contexto({}, { publica: true, permiso: 'alumno:consultar' })),
    ).resolves.toBe(true);
  });
});
