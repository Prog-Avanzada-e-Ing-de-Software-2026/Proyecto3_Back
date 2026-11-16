import type { INestApplication } from '@nestjs/common';
import { Controller, Get, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GlobalExceptionFilter } from '../src/common/presentation/global-exception.filter.js';
import { RequierePermiso } from '../src/common/presentation/auth/requiere-permiso.decorator.js';
import { USUARIO_REPOSITORY } from '../src/modules/auth/auth.repository-tokens.js';
import { Permiso } from '../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../src/modules/auth/domain/entities/usuario.entity.js';
import {
  CONFIGURACION_SESION,
  leerConfiguracionSesion,
} from '../src/modules/auth/infrastructure/config/jwt-config.js';
import { AuthGuard } from '../src/modules/auth/presentation/auth.guard.js';
import { SesionService } from '../src/modules/auth/presentation/sesion.service.js';
import { NOMBRES_PERMISO } from '../src/modules/auth/domain/catalogos.js';
import { initOrmMetadata } from './support/orm-metadata.js';
import { UsuarioRepositoryFalso } from './support/fakes-auth.js';

const CONFIGURACION = leerConfiguracionSesion();

@Controller('sonda')
class ControladorDeSonda {
  @Get('libre')
  libre(): { ok: boolean } {
    return { ok: true };
  }

  @Get('alumnos')
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_ALUMNOS)
  gestionarAlumnos(): { ok: boolean } {
    return { ok: true };
  }
}

function crearModulo(usuarios: Usuario[]): new () => object {
  @Module({
    imports: [JwtModule.register({})],
    controllers: [ControladorDeSonda],
    providers: [
      SesionService,
      { provide: CONFIGURACION_SESION, useValue: CONFIGURACION },
      { provide: USUARIO_REPOSITORY, useValue: new UsuarioRepositoryFalso(usuarios) },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    ],
  })
  class ModuloDePermisos {}

  return ModuloDePermisos;
}

function crearUsuario(id: number, email: string, nombresPermisos: string[]): Usuario {
  const rol = Rol.crear({
    nombre: `rol-${id}`,
    permisos: nombresPermisos.map((nombre) => Permiso.crear({ nombre })),
  });
  const usuario = Usuario.crear({ email, passwordHash: 'hash', rol });
  usuario.id = id;

  return usuario;
}

function accessPara(usuarioId: number): Promise<string> {
  return new JwtService({}).signAsync(
    { sub: usuarioId, tipo: 'access' },
    { secret: CONFIGURACION.secretoAccess, expiresIn: CONFIGURACION.ttlAccess },
  );
}

describe('Autorización por permiso (e2e)', () => {
  let app: INestApplication;
  let conPermiso: Usuario;
  let sinPermiso: Usuario;

  beforeAll(() => {
    initOrmMetadata();

    conPermiso = crearUsuario(1, 'admin@gym.com', [NOMBRES_PERMISO.GESTIONAR_ALUMNOS]);
    sinPermiso = crearUsuario(2, 'alumno@gym.com', [NOMBRES_PERMISO.CREAR_PLAN]);
  });

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      imports: [crearModulo([conPermiso, sinPermiso])],
    }).compile();

    app = modulo.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[identidad-usuario] con el permiso declarado la operación se ejecuta', async () => {
    const access = await accessPara(1);

    await request(app.getHttpServer())
      .get('/sonda/alumnos')
      .set('Cookie', `access=${access}`)
      .expect(200);
  });

  it('[identidad-usuario] sin el permiso responde 403 y no ejecuta la operación', async () => {
    const access = await accessPara(2);
    const respuesta = await request(app.getHttpServer())
      .get('/sonda/alumnos')
      .set('Cookie', `access=${access}`)
      .expect(403);

    expect(respuesta.body).toMatchObject({
      statusCode: 403,
      code: 'SIN_PERMISO',
    });
    expect(respuesta.body.requestId).toBeDefined();
  });

  it('[identidad-usuario] sin sesión responde 401 y no evalúa permisos', async () => {
    const respuesta = await request(app.getHttpServer()).get('/sonda/alumnos').expect(401);

    expect(respuesta.body.code).toBe('SESION_INVALIDA');
  });

  it('[identidad-usuario] una operación sin permiso declarado no se restringe', async () => {
    const access = await accessPara(2);

    await request(app.getHttpServer())
      .get('/sonda/libre')
      .set('Cookie', `access=${access}`)
      .expect(200);
  });
});
