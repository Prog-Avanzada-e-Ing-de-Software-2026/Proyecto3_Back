const LONGITUD_MINIMA_SECRETO = 32;

/** Duración de la sesión: un turno de trabajo. */
export const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;

/**
 * Opciones de firma del token de sesión.
 *
 * El vencimiento se declara acá y no en el módulo para que la cookie y el token
 * compartan la misma fuente: dos valores distintos dejarían un token válido
 * después de que el navegador dejó de enviarlo.
 */
export const OPCIONES_FIRMA_SESION = {
  algorithm: 'HS256',
  expiresIn: DURACION_SESION_SEGUNDOS,
} as const;

/**
 * Lee el secreto de firma de la sesión.
 *
 * Falla el arranque en vez de firmar con un valor por defecto: un secreto
 * ausente o corto convertiría un error de despliegue en una sesión
 * falsificable.
 */
export function leerSecretoJwt(valor: string | undefined = process.env.AUTH_JWT_SECRET): string {
  const secreto = typeof valor === 'string' ? valor.trim() : '';

  if (secreto.length < LONGITUD_MINIMA_SECRETO) {
    throw new Error(
      `AUTH_JWT_SECRET es obligatoria y debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres.`,
    );
  }

  return secreto;
}
