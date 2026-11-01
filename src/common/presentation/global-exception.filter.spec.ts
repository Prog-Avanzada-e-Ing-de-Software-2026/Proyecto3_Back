import { HttpException, Logger, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoriaError } from '../domain/errors/error-semantico.js';
import { ErrorSemantico } from '../domain/errors/error-semantico.js';
import { PATRON_IDENTIFICADOR_SOLICITUD } from './request-id.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';

interface RespuestaFalsa {
  setHeader: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
}

function crearHost(solicitud: Partial<Request> = {}): {
  host: ArgumentsHost;
  respuesta: RespuestaFalsa;
} {
  const respuesta: RespuestaFalsa = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  respuesta.status.mockReturnValue(respuesta);

  const host = {
    switchToHttp: () => ({
      getResponse: () => respuesta,
      getRequest: () => solicitud,
    }),
  } as unknown as ArgumentsHost;

  return { host, respuesta };
}

function cuerpoEnviado(respuesta: RespuestaFalsa): Record<string, unknown> {
  return respuesta.json.mock.calls[0]?.[0] as Record<string, unknown>;
}

describe('GlobalExceptionFilter', () => {
  let errorLog: ReturnType<typeof vi.spyOn>;
  let warnLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    warnLog = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['no_encontrado', 404],
    ['conflicto', 409],
    ['no_autenticado', 401],
    ['prohibido', 403],
    ['entrada_invalida', 400],
  ] as const)(
    '[http-error-contract] traduce la categoria %s al estado %i',
    (categoria, estado) => {
      const { host, respuesta } = crearHost({ id: 'solicitud-1' } as Partial<Request>);
      const filtro = new GlobalExceptionFilter();

      filtro.catch(new ErrorSemantico(categoria, 'CODIGO_DE_PRUEBA', 'mensaje seguro'), host);

      expect(respuesta.status).toHaveBeenCalledWith(estado);
      expect(cuerpoEnviado(respuesta)).toEqual({
        statusCode: estado,
        code: 'CODIGO_DE_PRUEBA',
        message: 'mensaje seguro',
        requestId: 'solicitud-1',
      });
    },
  );

  it('[http-error-contract] responde 500 ante un error inesperado sin exponer detalles internos', () => {
    const { host, respuesta } = crearHost({ id: 'solicitud-2' } as Partial<Request>);
    const filtro = new GlobalExceptionFilter();

    filtro.catch(new Error('select * from usuarios where documento = 30111222'), host);

    const cuerpo = cuerpoEnviado(respuesta);
    expect(respuesta.status).toHaveBeenCalledWith(500);
    expect(cuerpo).toEqual({
      statusCode: 500,
      code: 'ERROR_INTERNO',
      message: 'Ocurrió un error inesperado.',
      requestId: 'solicitud-2',
    });
    expect(JSON.stringify(cuerpo)).not.toContain('select');
    expect(JSON.stringify(cuerpo)).not.toContain('30111222');
  });

  it('[http-error-contract] responde 500 cuando la categoria semantica es desconocida', () => {
    const { host, respuesta } = crearHost({ id: 'solicitud-3' } as Partial<Request>);
    const filtro = new GlobalExceptionFilter();

    filtro.catch(
      new ErrorSemantico('categoria_inventada' as CategoriaError, 'CODIGO', 'mensaje seguro'),
      host,
    );

    const cuerpo = cuerpoEnviado(respuesta);
    expect(respuesta.status).toHaveBeenCalledWith(500);
    expect(cuerpo.statusCode).toBe(500);
    expect(JSON.stringify(cuerpo)).not.toContain('categoria_inventada');
  });

  it('[http-error-contract] normaliza la excepcion del framework sin convertirla en 500', () => {
    const { host, respuesta } = crearHost({ id: 'solicitud-4' } as Partial<Request>);
    const filtro = new GlobalExceptionFilter();

    filtro.catch(new NotFoundException(), host);

    const cuerpo = cuerpoEnviado(respuesta);
    expect(respuesta.status).toHaveBeenCalledWith(404);
    expect(cuerpo.statusCode).toBe(404);
    expect(cuerpo.code).toBe('NO_ENCONTRADO');
  });

  it('[http-error-contract] usa un codigo derivado del estado para excepciones HTTP no previstas', () => {
    const { host, respuesta } = crearHost({ id: 'solicitud-5' } as Partial<Request>);
    const filtro = new GlobalExceptionFilter();

    filtro.catch(new HttpException('teapot', 418), host);

    expect(respuesta.status).toHaveBeenCalledWith(418);
    expect(cuerpoEnviado(respuesta).code).toBe('ERROR_HTTP');
  });

  it('[http-error-contract] reutiliza el identificador entrante valido en la cabecera', () => {
    const { host, respuesta } = crearHost({
      id: 'solicitud-entrante',
    } as Partial<Request>);
    const filtro = new GlobalExceptionFilter();

    filtro.catch(new ErrorSemantico('conflicto', 'CODIGO', 'mensaje seguro'), host);

    expect(respuesta.setHeader).toHaveBeenCalledWith('X-Request-Id', 'solicitud-entrante');
  });

  it('[http-error-contract] genera un identificador con formato admitido cuando la solicitud no lo trae', () => {
    const { host, respuesta } = crearHost({ headers: {} } as Partial<Request>);
    const filtro = new GlobalExceptionFilter();

    filtro.catch(new ErrorSemantico('conflicto', 'CODIGO', 'mensaje seguro'), host);

    const cuerpo = cuerpoEnviado(respuesta);
    expect(cuerpo.requestId).toMatch(PATRON_IDENTIFICADOR_SOLICITUD);
    expect(respuesta.setHeader).toHaveBeenCalledWith('X-Request-Id', cuerpo.requestId);
  });

  it('[http-logging] registra la traza y la causa solo para fallos inesperados', () => {
    const filtro = new GlobalExceptionFilter();

    filtro.catch(new Error('causa original'), crearHost({ id: 'a' } as Partial<Request>).host);
    filtro.catch(
      new ErrorSemantico('conflicto', 'CODIGO', 'mensaje seguro'),
      crearHost({ id: 'b' } as Partial<Request>).host,
    );

    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(errorLog.mock.calls[0]?.[1]).toContain('causa original');
    expect(warnLog).toHaveBeenCalledTimes(1);
    expect(warnLog.mock.calls[0]?.[0]).toContain('CODIGO');
  });
});
