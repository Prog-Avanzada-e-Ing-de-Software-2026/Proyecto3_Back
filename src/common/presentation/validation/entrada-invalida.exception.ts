import { BadRequestException } from '@nestjs/common';
import type { DetalleValidacion } from './detalle-validacion.js';

/**
 * Fallo de validación de entrada con el detalle por campo.
 *
 * Vive en `presentation/` porque describe el contrato del transporte, no una
 * regla del gimnasio. Extiende una excepción HTTP para que el filtro global
 * conserve su rama de normalización si alguna vez la recibe sin detalle, y el
 * filtro la reconoce por su tipo para agregar `errores` al cuerpo.
 */
export class EntradaInvalidaException extends BadRequestException {
  readonly errores: DetalleValidacion[];

  constructor(errores: DetalleValidacion[]) {
    super('La solicitud no es válida.');
    this.name = 'EntradaInvalidaException';
    this.errores = errores;
  }
}

export function esErrorConDetalle(
  exception: unknown,
): exception is EntradaInvalidaException {
  return exception instanceof EntradaInvalidaException;
}
