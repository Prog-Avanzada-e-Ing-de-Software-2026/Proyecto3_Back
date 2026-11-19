import { ErrorSemantico } from '../../../common/domain/errors/error-semantico.js';

/** Mínimo que exige la especificación para una credencial. */
export const LONGITUD_MINIMA_CREDENCIAL = 8;

/**
 * Rechaza una credencial por debajo del mínimo.
 *
 * Vive en el dominio porque el mínimo es una condición de la credencial y la
 * comparten el alta normal y la carga inicial del administrador.
 */
export function exigirCredencial(password: string): void {
  if (password.length >= LONGITUD_MINIMA_CREDENCIAL) {
    return;
  }

  throw new ErrorSemantico(
    'entrada_invalida',
    'CREDENCIAL_DEBIL',
    `La contraseña debe tener al menos ${LONGITUD_MINIMA_CREDENCIAL} caracteres.`,
  );
}
