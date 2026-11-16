import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ErrorSemantico } from '../../domain/errors/error-semantico.js';
import type { SolicitudAutenticada } from './solicitud-autenticada.js';

/**
 * Entrega el identificador del actor autenticado.
 *
 * `AGENTS.md` §6.2 exige que el actor salga del contexto de autenticación y
 * nunca del cuerpo o del query. Si falta, la operación se rechaza en vez de
 * escribir auditoría con un actor inventado.
 */
export const ActorActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): number => {
    const solicitud = contexto.switchToHttp().getRequest<SolicitudAutenticada>();

    if (solicitud.actorId === undefined) {
      throw new ErrorSemantico(
        'no_autenticado',
        'SESION_INVALIDA',
        'La operación requiere una sesión válida.',
      );
    }

    return solicitud.actorId;
  },
);
