const LONGITUD_MINIMA_SECRETO = 32;

/** Algoritmo de firma de las dos cookies de sesión. */
export const ALGORITMO_FIRMA = 'HS256';

/** Vencimiento del `access` cuando el entorno no lo define: un cuarto de hora. */
export const TTL_ACCESS_POR_DEFECTO = 15 * 60;

/** Vencimiento del `refresh` cuando el entorno no lo define: una semana. */
export const TTL_REFRESH_POR_DEFECTO = 7 * 24 * 60 * 60;

export type TipoToken = 'access' | 'refresh';

export interface ConfiguracionSesion {
  secretoAccess: string;
  secretoRefresh: string;
  ttlAccess: number;
  ttlRefresh: number;
}

/** Token de inyección: la configuración se lee una vez al arrancar, no por request. */
export const CONFIGURACION_SESION = Symbol('ConfiguracionSesion');

/**
 * Lee y valida la configuración de la sesión.
 *
 * Los dos secretos son obligatorios y distintos: con el mismo secreto, un
 * `access` filtrado permitiría firmar `refresh` y la separación de tipos sería
 * decorativa. Los vencimientos sí tienen valor por defecto porque no son una
 * decisión de seguridad; un valor inválido falla el arranque en vez de caer al
 * default en silencio.
 */
export function leerConfiguracionSesion(
  entorno: NodeJS.ProcessEnv = process.env,
): ConfiguracionSesion {
  const secretoAccess = exigirSecreto(entorno, 'AUTH_JWT_SECRET_ACCESS');
  const secretoRefresh = exigirSecreto(entorno, 'AUTH_JWT_SECRET_REFRESH');

  if (secretoAccess === secretoRefresh) {
    throw new Error(
      'AUTH_JWT_SECRET_ACCESS y AUTH_JWT_SECRET_REFRESH deben ser distintos: un secreto compartido anula la separación de tipos.',
    );
  }

  const ttlAccess = leerTtl(entorno, 'AUTH_ACCESS_TTL_SEGUNDOS', TTL_ACCESS_POR_DEFECTO);
  const ttlRefresh = leerTtl(entorno, 'AUTH_REFRESH_TTL_SEGUNDOS', TTL_REFRESH_POR_DEFECTO);

  if (ttlRefresh <= ttlAccess) {
    throw new Error(
      'AUTH_REFRESH_TTL_SEGUNDOS debe ser mayor que AUTH_ACCESS_TTL_SEGUNDOS: un refresh que no sobrevive al access no renueva nada.',
    );
  }

  return { secretoAccess, secretoRefresh, ttlAccess, ttlRefresh };
}

function exigirSecreto(entorno: NodeJS.ProcessEnv, variable: string): string {
  const valor = entorno[variable];

  if (typeof valor !== 'string' || valor.trim().length < LONGITUD_MINIMA_SECRETO) {
    throw new Error(
      `${variable} es obligatoria y debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres.`,
    );
  }

  return valor.trim();
}

function leerTtl(entorno: NodeJS.ProcessEnv, variable: string, porDefecto: number): number {
  const valor = entorno[variable];

  if (valor === undefined || valor.trim().length === 0) {
    return porDefecto;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`${variable} debe ser un entero de segundos mayor que cero.`);
  }

  return numero;
}
