const LONGITUD_MINIMA_SECRETO = 32;

/** Algoritmo de firma de las dos cookies de sesión. */
export const ALGORITMO_FIRMA = 'HS256';

/** El access vive un cuarto de hora: el front lo renueva con el refresh. */
export const DURACION_ACCESS_SEGUNDOS = 15 * 60;

/** El refresh vive una semana. */
export const DURACION_REFRESH_SEGUNDOS = 7 * 24 * 60 * 60;

export type TipoToken = 'access' | 'refresh';

/** Cada token lleva su tipo en el contenido: uno no sirve como el otro. */
export const DURACION_POR_TIPO: Record<TipoToken, number> = {
  access: DURACION_ACCESS_SEGUNDOS,
  refresh: DURACION_REFRESH_SEGUNDOS,
};

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
