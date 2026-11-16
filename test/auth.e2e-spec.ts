import type { INestApplication } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GlobalExceptionFilter } from '../src/common/presentation/global-exception.filter.js';
import { crearValidationPipe } from '../src/common/presentation/validation/validation-pipe.js';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case.js';
import { ReadSesionUseCase } from '../src/modules/auth/application/use-cases/read-sesion.use-case.js';
import {
  PASSWORD_HASHER,
  USUARIO_REPOSITORY,
} from '../src/modules/auth/auth.repository-tokens.js';
import { Permiso } from '../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../src/modules/auth/domain/entities/usuario.entity.js';
import type { IPasswordHasher } from '../src/modules/auth/domain/interfaces/password-hasher.interface.js';
import {
  CONFIGURACION_SESION,
  TTL_ACCESS_POR_DEFECTO,
  TTL_REFRESH_POR_DEFECTO,
} from '../src/modules/auth/infrastructure/config/jwt-config.js';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/services/argon2-password-hasher.js';
import { AuthController } from '../src/modules/auth/presentation/auth.controller.js';
import { AuthGuard } from '../src/modules/auth/presentation/auth.guard.js';
import { SesionService } from '../src/modules/auth/presentation/sesion.service.js';
import { initOrmMetadata } from './support/orm-metadata.js';
import { UsuarioRepositoryFalso } from './support/fakes-auth.js';

const SECRETO_ACCESS = 'un-secreto-de-pruebas-access-con-longitud-suficiente';
const SECRETO_REFRESH = 'un-secreto-de-pruebas-refresh-con-longitud-suficiente';
const CLAVE = '30123456';

const CONFIGURACION = {
  secretoAccess: SECRETO_ACCESS,
  secretoRefresh: SECRETO_REFRESH,
  ttlAccess: 900,
  ttlRefresh: 604_800,
};

/** Firma un token de prueba con el secreto real del tipo que se quiere emitir. */
function firmarToken(
  contenido: Record<string, unknown>,
  opciones: { secreto?: string; expiresIn?: number } = {},
): Promise<string> {
  const servicio = new JwtService({});

  return opciones.expiresIn === undefined
    ? servicio.signAsync(contenido, { secret: opciones.secreto ?? SECRETO_REFRESH })
    : servicio.signAsync(contenido, {
        secret: opciones.secreto ?? SECRETO_REFRESH,
        expiresIn: opciones.expiresIn,
      });
}

function crearModulo(usuarios: Usuario[]): new () => object {
  @Module({
    imports: [JwtModule.register({ signOptions: { algorithm: 'HS256' } })],
    controllers: [AuthController],
    providers: [
      LoginUseCase,
      ReadSesionUseCase,
      SesionService,
      { provide: USUARIO_REPOSITORY, useValue: new UsuarioRepositoryFalso(usuarios) },
      { provide: CONFIGURACION_SESION, useValue: CONFIGURACION },
      { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    ],
  })
  class ModuloDeAutenticacion {}

  return ModuloDeAutenticacion;
}

/**
 * Reproduce la configuración de `src/main.ts`: prefijo, `ValidationPipe`,
 * `cookie-parser` y Swagger. `main.ts` ejecuta `bootstrap()` al importarse, así
 * que el arnés no puede reutilizarlo; el `ValidationPipe` sí se comparte con
 * `crearValidationPipe()`, y el prefijo y la ruta de la documentación se
 * verifican acá.
 */
async function crearAplicacion(usuarios: Usuario[]): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [crearModulo(usuarios)] }).compile();
  const app = modulo.createNestApplication();

  app.use(cookieParser());
  app.useGlobalPipes(crearValidationPipe());
  app.setGlobalPrefix('api');
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Gym MVP API').build()),
  );
  await app.init();

  return app;
}

function galletasDe(respuesta: request.Response): Record<string, string> {
  const cabecera: unknown = respuesta.headers['set-cookie'];
  const galletas = Array.isArray(cabecera) ? cabecera : [];
  const porNombre: Record<string, string> = {};

  for (const galleta of galletas) {
    const [par] = galleta.split(';');
    const indice = (par ?? '').indexOf('=');

    porNombre[(par ?? '').slice(0, indice)] = galleta;
  }

  return porNombre;
}

function valorDe(galleta: string | undefined): string {
  const par = (galleta ?? '').split(';')[0] ?? '';

  return par.slice(par.indexOf('=') + 1);
}

interface ContenidoToken {
  sub: number;
  tipo: string;
  iat?: number;
  exp?: number;
}

function decodificar(token: string): ContenidoToken {
  return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as ContenidoToken;
}

describe('Autenticación (e2e)', () => {
  let app: INestApplication;
  let usuario: Usuario;
  let dadoDeBaja: Usuario;

  beforeAll(async () => {
    initOrmMetadata();

    const hasher: IPasswordHasher = new Argon2PasswordHasher();
    const rol = Rol.crear({
      nombre: 'Alumno',
      permisos: [Permiso.crear({ nombre: 'Crear plan' })],
    });
    const hash = await hasher.hash(CLAVE);

    usuario = Usuario.crear({ email: 'alumno@gym.com', passwordHash: hash, rol });
    usuario.id = 7;
    dadoDeBaja = Usuario.crear({ email: 'baja@gym.com', passwordHash: hash, rol });
    dadoDeBaja.id = 8;
    dadoDeBaja.deletedAt = new Date('2026-03-01T10:00:00.000Z');

  });

  beforeEach(async () => {
    app = await crearAplicacion([usuario, dadoDeBaja]);
  });

  afterAll(async () => {
    await app.close();
  });

  async function iniciarSesion(): Promise<Record<string, string>> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(200);

    return galletasDe(respuesta);
  }

  it('[HU 14] inicia sesión y devuelve rol y permisos efectivos', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(200);

    expect(respuesta.body).toEqual({
      id: 7,
      email: 'alumno@gym.com',
      rol: 'Alumno',
      permisos: ['Crear plan'],
    });
  });

  it('[autenticacion-sesion] emite una cookie de access y otra de refresh', async () => {
    const galletas = await iniciarSesion();

    expect(Object.keys(galletas).sort()).toEqual(['access', 'refresh']);
  });

  it('[autenticacion-sesion] emite las dos cookies legibles por JavaScript', async () => {
    const galletas = await iniciarSesion();

    expect(galletas.access).not.toMatch(/HttpOnly/i);
    expect(galletas.refresh).not.toMatch(/HttpOnly/i);
    expect(galletas.access).toMatch(/SameSite=Lax/i);
    expect(galletas.refresh).toMatch(/SameSite=Lax/i);
  });

  it('[autenticacion-sesion] el access vence en 15 minutos y el refresh en 7 días', async () => {
    const galletas = await iniciarSesion();
    const access = decodificar(valorDe(galletas.access));
    const refresh = decodificar(valorDe(galletas.refresh));

    expect(access.tipo).toBe('access');
    expect((access.exp ?? 0) - (access.iat ?? 0)).toBe(TTL_ACCESS_POR_DEFECTO);
    expect(refresh.tipo).toBe('refresh');
    expect((refresh.exp ?? 0) - (refresh.iat ?? 0)).toBe(TTL_REFRESH_POR_DEFECTO);
  });

  it('[autenticacion-sesion] el refresh renueva el access sin volver a emitir el refresh', async () => {
    const galletas = await iniciarSesion();
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh=${valorDe(galletas.refresh)}`)
      .expect(200);

    const renovadas = galletasDe(respuesta);

    expect(Object.keys(renovadas)).toEqual(['access']);
    expect(decodificar(valorDe(renovadas.access)).sub).toBe(7);
    expect(respuesta.body).toEqual({
      id: 7,
      email: 'alumno@gym.com',
      rol: 'Alumno',
      permisos: ['Crear plan'],
    });
  });

  it('[autenticacion-sesion] el refresh exige la cookie de refresh, no la de access', async () => {
    const galletas = await iniciarSesion();

    await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh=${valorDe(galletas.access)}`)
      .expect(401);
  });

  it('[autenticacion-sesion] rechaza un refresh vencido', async () => {
    const vencido = await firmarToken({ sub: 7, tipo: 'refresh' }, { expiresIn: -1 });

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh=${vencido}`)
      .expect(401);
  });

  it('[autenticacion-sesion] un refresh firmado con el secreto de access se rechaza', async () => {
    const ajeno = await firmarToken(
      { sub: 7, tipo: 'refresh' },
      { secreto: SECRETO_ACCESS },
    );

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh=${ajeno}`)
      .expect(401);
  });

  it('[RN-34] el refresh de un usuario dado de baja no emite un access nuevo', async () => {
    const deBaja = await firmarToken({ sub: 8, tipo: 'refresh' });

    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh=${deBaja}`)
      .expect(401);

    expect(galletasDe(respuesta)).toEqual({});
  });

  it('[autenticacion-sesion] acepta el email en distinta capitalización', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ALUMNO@GYM.COM', password: CLAVE })
      .expect(200);

    expect(respuesta.body.email).toBe('alumno@gym.com');
  });

  it('[HU 14] responde igual ante contraseña incorrecta y ante email inexistente', async () => {
    const incorrecta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: '00000000' })
      .expect(401);

    const inexistente = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nadie@gym.com', password: CLAVE })
      .expect(401);

    expect(incorrecta.body.code).toBe('CREDENCIALES_INVALIDAS');
    expect(inexistente.body.code).toBe(incorrecta.body.code);
    expect(inexistente.body.message).toBe(incorrecta.body.message);
    expect(galletasDe(incorrecta)).toEqual({});
  });

  it('[RN-34] rechaza a un usuario dado de baja con el mismo cuerpo que una credencial inválida', async () => {
    const dadoDeBajaRespuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'baja@gym.com', password: CLAVE })
      .expect(401);

    const incorrecta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: '00000000' })
      .expect(401);

    expect(dadoDeBajaRespuesta.body.code).toBe(incorrecta.body.code);
    expect(dadoDeBajaRespuesta.body.message).toBe(incorrecta.body.message);
    expect(galletasDe(dadoDeBajaRespuesta)).toEqual({});
  });

  it('[autenticacion-sesion] no expone el hash ni los tokens en el cuerpo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(200);

    const texto = JSON.stringify(respuesta.body);

    expect(texto).not.toContain('argon2');
    expect(texto).not.toContain(CLAVE);
    expect(texto).not.toContain(valorDe(galletasDe(respuesta).access));
    expect(texto).not.toContain(valorDe(galletasDe(respuesta).refresh));
  });

  it('[http-error-contract] rechaza una columna de auditoria enviada en el cuerpo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE, createdById: 999 })
      .expect(400);

    expect(respuesta.body.code).toBe('SOLICITUD_INVALIDA');
    expect(respuesta.body.errores).toEqual([
      {
        campo: 'createdById',
        mensaje: 'La propiedad "createdById" no está admitida en la solicitud.',
      },
    ]);
  });

  it('[http-error-contract] informa el formato invalido del email', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno-arroba-gym', password: CLAVE })
      .expect(400);

    expect(respuesta.body).toMatchObject({
      statusCode: 400,
      code: 'SOLICITUD_INVALIDA',
      message: 'La solicitud no es válida.',
    });
    expect(respuesta.body.errores).toEqual([
      { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
    ]);
  });

  it('[http-error-contract] nombra el atributo mal escrito en lugar de descartarlo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: 'alumno@gym.com', password: CLAVE })
      .expect(400);

    expect(respuesta.body.errores).toEqual([
      { campo: 'correo', mensaje: 'La propiedad "correo" no está admitida en la solicitud.' },
      { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
      { campo: 'email', mensaje: 'El email es obligatorio.' },
    ]);
  });

  it('[http-error-contract] informa la ausencia del email como obligatorio', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ password: CLAVE })
      .expect(400);

    expect(respuesta.body.errores).toContainEqual({
      campo: 'email',
      mensaje: 'El email es obligatorio.',
    });
  });

  it('[autenticacion-sesion] devuelve la identidad del usuario autenticado', async () => {
    const galletas = await iniciarSesion();
    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access=${valorDe(galletas.access)}`)
      .expect(200);

    expect(respuesta.body).toEqual({
      id: 7,
      email: 'alumno@gym.com',
      rol: 'Alumno',
      permisos: ['Crear plan'],
    });
  });

  it('[autenticacion-sesion] la consulta de identidad no emite cookies nuevas', async () => {
    const galletas = await iniciarSesion();
    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access=${valorDe(galletas.access)}`)
      .expect(200);

    expect(galletasDe(respuesta)).toEqual({});
  });

  it('[autenticacion-sesion] la consulta sin sesión responde 401 sin datos del usuario', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    expect(respuesta.body.code).toBe('SESION_INVALIDA');
    expect(respuesta.body).not.toHaveProperty('email');
  });

  it('[RN-34] la consulta de identidad de un usuario dado de baja responde 401', async () => {
    const access = await firmarToken({ sub: 8, tipo: 'access' }, { secreto: SECRETO_ACCESS });

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access=${access}`)
      .expect(401);
  });

  it('[implement-login] publica la documentación y no atiende rutas fuera del prefijo', async () => {
    const documentacion = await request(app.getHttpServer()).get('/api/docs-json').expect(200);

    expect(Object.keys(documentacion.body.paths)).toContain('/api/auth/login');
    expect(Object.keys(documentacion.body.paths)).toContain('/api/auth/refresh');
    expect(Object.keys(documentacion.body.paths)).toContain('/api/auth/me');

    const respuestas = documentacion.body.paths['/api/auth/login'].post.responses as Record<
      string,
      { content?: { 'application/json'?: { schema?: { properties?: Record<string, unknown> } } } }
    >;
    expect(respuestas['400']?.content?.['application/json']?.schema?.properties?.['errores'])
      .toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(404);
  });
});
