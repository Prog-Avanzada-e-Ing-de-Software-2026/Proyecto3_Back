import { pinoHttp } from 'pino-http';
import { describe, expect, it } from 'vitest';
import { resolverNivelLog, buildPinoHttpOptions } from './pino-options.js';

function crearDestinoEnMemoria(): { lineas: string[]; stream: { write(linea: string): void } } {
  const lineas: string[] = [];

  return { lineas, stream: { write: (linea: string) => void lineas.push(linea) } };
}

describe('resolverNivelLog', () => {
  it('[http-logging] usa el nivel configurado cuando es un nivel admitido', () => {
    expect(resolverNivelLog('debug')).toBe('debug');
    expect(resolverNivelLog('SILENT')).toBe('silent');
  });

  it('[http-logging] usa info cuando el nivel falta o no es admitido', () => {
    expect(resolverNivelLog(undefined)).toBe('info');
    expect(resolverNivelLog('')).toBe('info');
    expect(resolverNivelLog('verbose')).toBe('info');
  });
});

describe('buildPinoHttpOptions', () => {
  it('[http-logging] emite una linea JSON valida por evento', () => {
    const destino = crearDestinoEnMemoria();
    const middleware = pinoHttp(buildPinoHttpOptions(), destino.stream);
    const logger = middleware.logger;

    logger.info({ req: { id: 'solicitud-1', method: 'GET', url: '/probe/ok' } }, 'solicitud atendida');

    expect(destino.lineas).toHaveLength(1);
    expect(() => JSON.parse(destino.lineas[0]!)).not.toThrow();
  });

  it('[http-logging] redacta contrasena, documento, token y cookies', () => {
    const destino = crearDestinoEnMemoria();
    const middleware = pinoHttp(buildPinoHttpOptions(), destino.stream);
    const logger = middleware.logger;

    logger.info(
      {
        body: { password: 'contrasena-real', documento: '30111222' },
        req: {
          id: 'solicitud-2',
          method: 'POST',
          url: '/auth/login',
          headers: { authorization: 'Bearer token-real', cookie: 'access=token-real' },
        },
      },
      'intento de login',
    );

    const salida = destino.lineas.join('');

    expect(salida).not.toContain('contrasena-real');
    expect(salida).not.toContain('30111222');
    expect(salida).not.toContain('token-real');
    expect(salida).not.toContain('Bearer');
  });

  it('[http-logging] no registra los valores de la cadena de consulta', () => {
    const destino = crearDestinoEnMemoria();
    const middleware = pinoHttp(buildPinoHttpOptions(), destino.stream);
    const logger = middleware.logger;

    logger.info(
      {
        req: {
          id: 'solicitud-4',
          method: 'GET',
          url: '/?token=secreto&documento=30111222',
        },
      },
      'solicitud atendida',
    );

    const salida = destino.lineas.join('');

    expect(salida).not.toContain('secreto');
    expect(salida).not.toContain('30111222');
    expect(JSON.parse(destino.lineas[0]!).req.url).toBe('/');
  });

  it('[http-logging] registra solo metodo, ruta e identificador de la solicitud', () => {
    const destino = crearDestinoEnMemoria();
    const middleware = pinoHttp(buildPinoHttpOptions(), destino.stream);
    const logger = middleware.logger;

    logger.info(
      {
        req: {
          id: 'solicitud-3',
          method: 'GET',
          url: '/probe/ok',
          headers: { cookie: 'access=token-real' },
          body: { password: 'contrasena-real' },
        },
      },
      'solicitud atendida',
    );

    const evento = JSON.parse(destino.lineas[0]!);

    expect(evento.req).toEqual({ id: 'solicitud-3', method: 'GET', url: '/probe/ok' });
  });
});
