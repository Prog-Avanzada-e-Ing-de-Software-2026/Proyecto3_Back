import type { Options } from 'pino-http';
import { resolverIdentificadorSolicitud } from '../request-id.js';

export const NIVELES_LOG = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export type NivelLog = (typeof NIVELES_LOG)[number];

/**
 * Nivel mínimo de registro. Un valor ausente o no admitido no impide el
 * arranque: cae en `info`, que conserva la trazabilidad de solicitudes y
 * fallos sin inundar la salida.
 */
export function resolverNivelLog(valor?: string): NivelLog {
  const normalizado = valor?.trim().toLowerCase();

  return NIVELES_LOG.includes(normalizado as NivelLog) ? (normalizado as NivelLog) : 'info';
}

/**
 * Rutas que nunca pueden aparecer en un evento de log. La lista blanca del
 * serializador de `req` es la primera barrera; estas rutas cubren objetos que
 * un componente decida registrar por su cuenta.
 */
export const RUTAS_REDACTADAS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  'documento',
  '*.documento',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
] as const;

/**
 * Ruta solicitada sin la cadena de consulta.
 *
 * `req.url` incluye los parámetros (`?documento=...&token=...`) y el redactor de
 * pino no opera dentro de una cadena: registrar solo la ruta evita filtrar esos
 * valores al log.
 */
export function rutaSolicitada(url?: string): string | undefined {
  if (typeof url !== 'string') {
    return undefined;
  }

  const finDeRuta = url.indexOf('?');

  return finDeRuta === -1 ? url : url.slice(0, finDeRuta);
}

export function buildPinoHttpOptions(env: NodeJS.ProcessEnv = process.env): Options {
  return {
    level: resolverNivelLog(env.LOG_LEVEL),
    redact: { paths: [...RUTAS_REDACTADAS], censor: '[REDACTADO]' },
    serializers: {
      req: (req: { id?: string; method?: string; url?: string }) => ({
        id: req.id,
        method: req.method,
        url: rutaSolicitada(req.url),
      }),
      res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
    },
    genReqId: (req) => resolverIdentificadorSolicitud(req.headers['x-request-id']),
  };
}
