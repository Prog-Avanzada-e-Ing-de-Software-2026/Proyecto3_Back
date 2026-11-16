import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';

/**
 * Rechazo del inicio de sesión.
 *
 * Es una sola excepción para las tres causas —email inexistente, contraseña
 * incorrecta y usuario dado de baja— porque `HU 14` prohíbe revelar cuál de los
 * datos falló.
 */
export class CredencialesInvalidasError extends ErrorSemantico {
  constructor() {
    super('no_autenticado', 'CREDENCIALES_INVALIDAS', 'El email o la contraseña no son correctos.');
    this.name = 'CredencialesInvalidasError';
  }
}
