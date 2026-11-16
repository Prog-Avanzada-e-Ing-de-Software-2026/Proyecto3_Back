import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GlobalExceptionFilter } from '../src/common/presentation/global-exception.filter.js';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.use-case.js';
import {
  PASSWORD_HASHER,
  USUARIO_REPOSITORY,
} from '../src/modules/auth/auth.repository-tokens.js';
import { Permiso } from '../src/modules/auth/domain/entities/permiso.entity.js';
import { Rol } from '../src/modules/auth/domain/entities/rol.entity.js';
import { Usuario } from '../src/modules/auth/domain/entities/usuario.entity.js';
import type { IPasswordHasher } from '../src/modules/auth/domain/interfaces/password-hasher.interface.js';
import type { IUsuarioRepository } from '../src/modules/auth/domain/interfaces/usuario.repository.interface.js';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/services/argon2-password-hasher.js';
import { AuthController } from '../src/modules/auth/presentation/auth.controller.js';
import { AuthGuard } from '../src/modules/auth/presentation/auth.guard.js';
import { SesionService } from '../src/modules/auth/presentation/sesion.service.js';
import { initOrmMetadata } from './support/orm-metadata.js';

const SECRETO = 'un-secreto-de-pruebas-con-longitud-suficiente';
const CLAVE = '30123456';

class UsuarioRepositoryFalso implements IUsuarioRepository {
  constructor(private readonly usuarios: Usuario[]) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.email === email) ?? null;
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.id === id) ?? null;
  }
}

function crearModulo(usuarios: Usuario[]): new () => object {
  @Module({
    imports: [JwtModule.register({ secret: SECRETO, signOptions: { algorithm: 'HS256' } })],
    controllers: [AuthController],
    providers: [
      LoginUseCase,
      SesionService,
      { provide: USUARIO_REPOSITORY, useValue: new UsuarioRepositoryFalso(usuarios) },
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
 * que el arnés no puede reutilizarlo; mantener las dos copias en sintonía es
 * manual y por eso el prefijo y la ruta de la documentación se verifican acá.
 */
async function crearAplicacion(usuarios: Usuario[]): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [crearModulo(usuarios)] }).compile();
  const app = modulo.createNestApplication();

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Gym MVP API').build()),
  );
  await app.init();

  return app;
}

function galletasDe(respuesta: request.Response): string[] {
  const cabecera: unknown = respuesta.headers['set-cookie'];

  return Array.isArray(cabecera) ? cabecera : [];
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

  it('[HU 14] inicia sesión bajo el prefijo y deja la sesión en una cookie httpOnly', async () => {
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

    const galletas = galletasDe(respuesta);
    const sesion = galletas.find((galleta) => galleta.startsWith('sesion='));

    expect(sesion).toBeDefined();
    expect(sesion).toContain('HttpOnly');
    expect(sesion).toContain('Path=/');
    expect(sesion).toMatch(/SameSite=Lax/i);
    expect(sesion).toContain('Max-Age=28800');
  });

  it('[autenticacion-sesion] no expone el hash ni el token en el cuerpo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(200);

    const texto = JSON.stringify(respuesta.body);
    const token = galletasDe(respuesta)
      .find((galleta) => galleta.startsWith('sesion='))
      ?.split(';')[0]
      ?.slice('sesion='.length);

    expect(texto).not.toContain('argon2');
    expect(texto).not.toContain(CLAVE);
    expect(token).toBeDefined();
    expect(texto).not.toContain(token);
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
    expect(galletasDe(incorrecta)).toEqual([]);
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
    expect(galletasDe(dadoDeBajaRespuesta)).toEqual([]);
  });

  it('[autenticacion-sesion] cierra la sesión y deja de conceder acceso', async () => {
    const ingreso = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(200);
    const sesion = galletasDe(ingreso).find((galleta) => galleta.startsWith('sesion=')) ?? '';

    const salida = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', sesion.split(';')[0] ?? '')
      .expect(204);

    expect(galletasDe(salida).join(';')).toContain('sesion=;');
  });

  it('[autenticacion-sesion] rechaza una operación protegida sin sesión', async () => {
    const respuesta = await request(app.getHttpServer()).post('/api/auth/logout').expect(401);

    expect(respuesta.body.code).toBe('SESION_INVALIDA');
    expect(respuesta.body.requestId).toBeDefined();
  });

  it('[autenticacion-sesion] rechaza una sesión con la firma alterada', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'sesion=token.manipulado.invalido')
      .expect(401);
  });

  it('[autenticacion-sesion] descarta campos no declarados en el cuerpo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE, createdById: 999 })
      .expect(200);

    expect(respuesta.body).not.toHaveProperty('createdById');
  });

  it('[implement-login] publica la documentación y no atiende rutas fuera del prefijo', async () => {
    const documentacion = await request(app.getHttpServer()).get('/api/docs-json').expect(200);

    expect(Object.keys(documentacion.body.paths)).toContain('/api/auth/login');
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alumno@gym.com', password: CLAVE })
      .expect(404);
  });
});
