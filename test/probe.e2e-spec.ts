import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger as PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PATRON_IDENTIFICADOR_SOLICITUD } from '../src/common/presentation/request-id.js';
import { crearDestinoEnMemoria, crearProbeModule } from './support/probe.module.js';

interface EventoLog {
  level: number;
  msg?: string;
  context?: string;
  req?: { id?: string; method?: string; url?: string };
  res?: { statusCode?: number };
  responseTime?: number;
  err?: { stack?: string };
}

describe('Fundamento HTTP (e2e)', () => {
  // `nestjs-pino` construye un único middleware por proceso, así que el
  // destino se crea una vez y se vacía entre pruebas.
  const destino = crearDestinoEnMemoria();
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [crearProbeModule(destino.stream)],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useLogger(app.get(PinoLogger));
    await app.init();
    // Los eventos del arranque no pertenecen a ninguna solicitud.
    destino.lineas.length = 0;
  });

  afterEach(async () => {
    await app.close();
  });

  function eventos(): EventoLog[] {
    return destino.lineas.map((linea) => JSON.parse(linea) as EventoLog);
  }

  it('[http-error-contract] traduce cada categoria semantica al estado que le corresponde', async () => {
    const casos = [
      { ruta: '/probe/no-encontrado', estado: 404, code: 'RECURSO_NO_ENCONTRADO' },
      { ruta: '/probe/conflicto', estado: 409, code: 'ESTADO_EN_CONFLICTO' },
      { ruta: '/probe/no-autenticado', estado: 401, code: 'SIN_CREDENCIALES' },
      { ruta: '/probe/prohibido', estado: 403, code: 'SIN_PERMISO' },
      { ruta: '/probe/entrada-invalida', estado: 400, code: 'DATOS_INVALIDOS' },
    ] as const;

    for (const caso of casos) {
      const respuesta = await request(app.getHttpServer()).get(caso.ruta).expect(caso.estado);

      expect(Object.keys(respuesta.body).sort()).toEqual([
        'code',
        'message',
        'requestId',
        'statusCode',
      ]);
      expect(respuesta.body).toMatchObject({ statusCode: caso.estado, code: caso.code });
    }
  });

  it('[http-error-contract] responde 404 y no 500 cuando la ruta no existe', async () => {
    const respuesta = await request(app.getHttpServer()).get('/ruta-inexistente').expect(404);

    expect(respuesta.body).toMatchObject({ statusCode: 404, code: 'NO_ENCONTRADO' });
  });

  it('[http-error-contract] responde 500 sin exponer el detalle tecnico del fallo', async () => {
    const respuesta = await request(app.getHttpServer()).get('/probe/inesperado').expect(500);

    expect(respuesta.body).toMatchObject({ statusCode: 500, code: 'ERROR_INTERNO' });
    expect(JSON.stringify(respuesta.body)).not.toContain('select');
    expect(JSON.stringify(respuesta.body)).not.toContain('30111222');
  });

  it('[http-logging] registra la traza del fallo inesperado sin duplicarla en el evento de solicitud', async () => {
    await request(app.getHttpServer()).get('/probe/inesperado').expect(500);

    const finalizaciones = eventos().filter((evento) => evento.res?.statusCode === 500);
    const delFiltro = eventos().filter((evento) => evento.context === 'GlobalExceptionFilter');

    expect(finalizaciones).toHaveLength(1);
    expect(delFiltro).toHaveLength(1);
    expect(delFiltro[0]?.err?.stack).toContain('at ');
    expect(JSON.stringify(finalizaciones[0])).not.toContain('select');
    expect(JSON.stringify(eventos())).not.toContain('30111222');
  });

  it('[http-logging] registra los fallos esperados sin traza de pila', async () => {
    await request(app.getHttpServer()).get('/probe/conflicto').expect(409);

    const delFiltro = eventos().filter((evento) => evento.context === 'GlobalExceptionFilter');

    expect(delFiltro).toHaveLength(1);
    expect(delFiltro[0]?.err).toBeUndefined();
    expect(delFiltro[0]?.msg).toContain('ESTADO_EN_CONFLICTO');
  });

  it('[http-logging] registra metodo, ruta, estado, duracion e identificador de cada solicitud', async () => {
    await request(app.getHttpServer()).get('/probe/ok').expect(200);

    const finalizacion = eventos().find((evento) => evento.res?.statusCode === 200);

    expect(finalizacion).toMatchObject({
      req: { method: 'GET', url: '/probe/ok' },
      res: { statusCode: 200 },
    });
    expect(finalizacion?.req?.id).toBeDefined();
    expect(finalizacion?.responseTime).toBeTypeOf('number');
  });

  it('[http-error-contract] repite el identificador entrante valido en la respuesta y en los logs', async () => {
    const identificador = 'solicitud-entrante-1';

    const respuesta = await request(app.getHttpServer())
      .get('/probe/conflicto')
      .set('X-Request-Id', identificador)
      .expect(409);

    expect(respuesta.headers['x-request-id']).toBe(identificador);
    expect(respuesta.body.requestId).toBe(identificador);
    expect(eventos().every((evento) => evento.req?.id === identificador)).toBe(true);
  });

  it('[http-error-contract] reemplaza el identificador entrante invalido', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/probe/conflicto')
      .set('X-Request-Id', 'no vale')
      .expect(409);

    expect(respuesta.body.requestId).not.toBe('no vale');
    expect(respuesta.body.requestId).toMatch(PATRON_IDENTIFICADOR_SOLICITUD);
  });

  it('[http-error-contract] genera un identificador cuando la solicitud no lo trae', async () => {
    const respuesta = await request(app.getHttpServer()).get('/probe/conflicto').expect(409);

    expect(respuesta.body.requestId).toMatch(PATRON_IDENTIFICADOR_SOLICITUD);
    expect(respuesta.headers['x-request-id']).toBe(respuesta.body.requestId);
  });

  it('[http-logging] no registra cookies ni cabeceras de autorizacion', async () => {
    await request(app.getHttpServer())
      .get('/probe/ok')
      .set('Cookie', 'access=token-secreto')
      .set('Authorization', 'Bearer token-secreto')
      .expect(200);

    const salida = destino.lineas.join('');

    expect(salida).not.toContain('token-secreto');
  });

  it('[http-logging] no registra los valores de la cadena de consulta', async () => {
    await request(app.getHttpServer())
      .get('/probe/ok?documento=30111222&token=token-secreto')
      .expect(200);

    const salida = destino.lineas.join('');

    expect(salida).not.toContain('30111222');
    expect(salida).not.toContain('token-secreto');

    const finalizacion = eventos().find((evento) => evento.res?.statusCode === 200);
    expect(finalizacion?.req?.url).toBe('/probe/ok');
  });
});
