import { ApiBadRequestResponse } from '@nestjs/swagger';

/**
 * Esquema del `400` con el detalle de validación.
 *
 * `errores` es opcional porque el mismo estado también responde fallos
 * semánticos —un `PATCH` sin campos, por ejemplo— que no traen detalle por
 * campo. Se declara una sola vez para que los endpoints no copien el esquema.
 */
const ESQUEMA_SOLICITUD_INVALIDA = {
  type: 'object',
  required: ['statusCode', 'code', 'message', 'requestId'],
  properties: {
    statusCode: { type: 'number', example: 400 },
    code: { type: 'string', example: 'SOLICITUD_INVALIDA' },
    message: { type: 'string', example: 'La solicitud no es válida.' },
    requestId: {
      type: 'string',
      example: 'e786f57c-0b51-4492-bf26-6412e9e82e10',
    },
    errores: {
      type: 'array',
      description:
        'Detalle por campo. Presente solo cuando el fallo proviene de la validación de entrada.',
      items: {
        type: 'object',
        required: ['campo', 'mensaje'],
        properties: {
          campo: { type: 'string', example: 'email' },
          mensaje: {
            type: 'string',
            example: 'El email no tiene un formato válido.',
          },
        },
      },
    },
  },
};

export function ApiSolicitudInvalida(): MethodDecorator {
  return ApiBadRequestResponse({
    description:
      'La solicitud no cumple el contrato. Cuando el fallo es de validación de entrada, `errores` detalla cada campo inválido.',
    schema: ESQUEMA_SOLICITUD_INVALIDA,
  });
}
