import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

/**
 * Humo sobre el módulo real: la aplicación se compone con `AppModule` y el
 * guard global aplica a las rutas que existen. Los contratos de cada endpoint
 * se prueban en sus propias suites, con dobles de los puertos.
 */
describe('Aplicación (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('[autenticacion-sesion] el guard global cierra las rutas no declaradas públicas', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/roles').expect(401);

    expect(respuesta.body).toMatchObject({
      statusCode: 401,
      code: 'SESION_INVALIDA',
    });
    expect(respuesta.body.requestId).toBeDefined();
  });

  it('[autenticacion-sesion] rechaza una cookie de sesión manipulada', () => {
    return request(app.getHttpServer())
      .get('/api/roles')
      .set('Cookie', 'access=token.manipulado.invalido')
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
    return request(app.getHttpServer()).get('/roles').expect(404);
  });

  it('responde el contrato de error en una ruta inexistente', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/no-existe').expect(404);

    expect(respuesta.body.code).toBe('NO_ENCONTRADO');
  });
});
