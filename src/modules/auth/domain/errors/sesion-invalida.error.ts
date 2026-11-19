import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';

/**
 * La sesión presentada no sirve para la operación.
 *
 * Cubre la cookie ausente, el token vencido, la firma alterada, el tipo de token
 * equivocado y el usuario que ya no puede acceder. Desde el cliente son la
 * misma condición y no se distinguen en la respuesta.
 */
export class SesionInvalidaError extends ErrorSemantico {
  constructor() {
    super('no_autenticado', 'SESION_INVALIDA', 'La operación requiere una sesión válida.');
    this.name = 'SesionInvalidaError';
  }
}
