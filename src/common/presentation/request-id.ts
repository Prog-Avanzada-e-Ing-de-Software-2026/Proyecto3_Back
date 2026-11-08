import { randomUUID } from 'node:crypto';

/**
 * Formato admitido para el identificador de solicitud entrante. Rechaza
 * valores vacíos, demasiado largos o con caracteres que permitirían inyectar
 * contenido en logs y cabeceras.
 */
export const PATRON_IDENTIFICADOR_SOLICITUD = /^[A-Za-z0-9_-]{8,64}$/;

export function resolverIdentificadorSolicitud(entrante?: string | string[]): string {
  const valor = Array.isArray(entrante) ? entrante[0] : entrante;

  return valor !== undefined && PATRON_IDENTIFICADOR_SOLICITUD.test(valor) ? valor : randomUUID();
}
