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
      });
  });

  it('no atiende rutas fuera del prefijo global', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
