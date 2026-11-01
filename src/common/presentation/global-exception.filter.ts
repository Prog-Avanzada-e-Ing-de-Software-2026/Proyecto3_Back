import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { CategoriaError } from '../domain/errors/error-semantico.js';
import { ErrorSemantico } from '../domain/errors/error-semantico.js';
import { resolverIdentificadorSolicitud } from './request-id.js';

type SolicitudConIdentificador = Request & { id?: string };

const ESTADOS_POR_CATEGORIA: Record<CategoriaError, number> = {
  entrada_invalida: 400,
  no_autenticado: 401,
  prohibido: 403,
  no_encontrado: 404,
  conflicto: 409,
  inesperado: 500,
};

const CODIGOS_POR_ESTADO: Record<number, string> = {
  400: 'SOLICITUD_INVALIDA',
  401: 'NO_AUTENTICADO',
  403: 'PROHIBIDO',
  404: 'NO_ENCONTRADO',
  409: 'CONFLICTO',
  422: 'ENTIDAD_NO_PROCESABLE',
  429: 'DEMASIADAS_SOLICITUDES',
};

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'No autenticado.',
  403: 'No autorizado.',
  404: 'Recurso no encontrado.',
  409: 'La operación entra en conflicto con el estado actual.',
  422: 'La operación no puede procesarse con los datos recibidos.',
  429: 'Demasiadas solicitudes.',
};

const CODE_GENERICO = 'ERROR_HTTP';
const CODE_INTERNO = 'ERROR_INTERNO';
const MENSAJE_INTERNO = 'Ocurrió un error inesperado.';

interface CuerpoError {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
}

/**
 * Único lugar que arma una respuesta HTTP de error. Traduce errores
 * semánticos por categoría, normaliza las excepciones que emite el propio
 * framework y responde 500 sin exponer detalles internos ante cualquier otra
 * cosa.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const respuesta = http.getResponse<Response>();
    const solicitud = http.getRequest<SolicitudConIdentificador>();
    const requestId =
      solicitud.id ?? resolverIdentificadorSolicitud(solicitud.headers['x-request-id']);

    const cuerpo = this.construirCuerpo(exception, requestId);

    this.registrar(cuerpo, exception);

    respuesta.setHeader('X-Request-Id', requestId);
    respuesta.status(cuerpo.statusCode).json(cuerpo);
  }

  private construirCuerpo(exception: unknown, requestId: string): CuerpoError {
    if (exception instanceof ErrorSemantico) {
      const estado = ESTADOS_POR_CATEGORIA[exception.categoria];

      return estado === undefined
        ? this.cuerpoInesperado(requestId)
        : {
            statusCode: estado,
            code: exception.codigo,
            message: exception.message,
            requestId,
          };
    }

    if (exception instanceof HttpException) {
      const estado = exception.getStatus();

      return {
        statusCode: estado,
        code: CODIGOS_POR_ESTADO[estado] ?? CODE_GENERICO,
        message: MENSAJES_POR_ESTADO[estado] ?? MENSAJE_INTERNO,
        requestId,
      };
    }

    return this.cuerpoInesperado(requestId);
  }

  private cuerpoInesperado(requestId: string): CuerpoError {
    return {
      statusCode: 500,
      code: CODE_INTERNO,
      message: MENSAJE_INTERNO,
      requestId,
    };
  }

  private registrar(cuerpo: CuerpoError, exception: unknown): void {
    const contexto = `${cuerpo.code}: ${cuerpo.message}`;

    if (cuerpo.statusCode >= 500) {
      this.logger.error(contexto, exception instanceof Error ? exception.stack : undefined);
      return;
    }

    this.logger.warn(contexto);
  }
}
