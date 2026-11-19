import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ErrorSemantico } from '../../domain/errors/error-semantico.js';
import type { SolicitudAutenticada } from './solicitud-autenticada.js';

/**
 * Entrega el identificador del actor autenticado.
 *
 * Sale del contexto de autenticación y nunca del cuerpo o del query: si falta,
 * la operación se rechaza en vez de escribir auditoría con un actor inventado.
 */
export const ActorActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): number => {
    const solicitud = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
    const usuario = solicitud.usuario;

    if (usuario === undefined) {
      throw new ErrorSemantico(
        'no_autenticado',
        'SESION_INVALIDA',
        'La operación requiere una sesión válida.',
      );
    }

    return usuario.id;
  },
);
