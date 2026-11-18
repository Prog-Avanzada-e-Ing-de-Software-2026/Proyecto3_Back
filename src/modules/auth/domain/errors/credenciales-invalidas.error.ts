import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';

/**
 * Rechazo del inicio de sesión.
 *
 * Una sola excepción para todas las causas porque no se puede revelar cuál de los
 * datos falló.
 */
export class CredencialesInvalidasError extends ErrorSemantico {
  constructor() {
    super('no_autenticado', 'CREDENCIALES_INVALIDAS', 'El email o la contraseña no son correctos.');
    this.name = 'CredencialesInvalidasError';
  }
}
