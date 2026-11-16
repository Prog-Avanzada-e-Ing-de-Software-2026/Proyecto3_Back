import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('[autenticacion-sesion] el guard global cierra toda ruta no declarada pública', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('SESION_INVALIDA');
        expect(body.requestId).toBeDefined();
      });
  });

  it('[autenticacion-sesion] rechaza una cookie de sesión manipulada', () => {
    return request(app.getHttpServer())
      .get('/api')
      .set('Cookie', 'sesion=token.manipulado.invalido')
      .expect(401);
  });

  it('[autenticacion-sesion] el login es público: el guard no intercepta la ruta', async () => {
    // El 401 de este caso viene de la credencial, no del guard: sin la marca
    // @Public() la respuesta sería SESION_INVALIDA antes de evaluar el cuerpo.
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nadie@gym.com', password: '30123456' })
      .expect(401);

    expect(respuesta.body.code).toBe('CREDENCIALES_INVALIDAS');
  });

  it('no atiende rutas fuera del prefijo global', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
