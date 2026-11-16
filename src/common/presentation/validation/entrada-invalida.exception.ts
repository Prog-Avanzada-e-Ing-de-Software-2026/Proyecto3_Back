import { BadRequestException } from '@nestjs/common';
import type { DetalleValidacion } from './detalle-validacion.js';

/**
 * Fallo de validación de entrada con el detalle por campo.
 *
 * Vive en `presentation/` porque describe el contrato del transporte, no una
 * regla del gimnasio. Extiende una excepción HTTP para que el estado sea `400`
 * también fuera de este filtro, y el filtro la reconoce por su tipo para
 * agregar `errores` al cuerpo sin interpretar la forma interna del framework.
 * El mensaje repite el texto del `400` que responde el filtro; un test unitario
 * fija ambos para que no se desincronicen.
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
