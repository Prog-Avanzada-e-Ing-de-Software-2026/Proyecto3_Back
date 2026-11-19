import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { EntradaInvalidaException } from './entrada-invalida.exception.js';
import { detallesDeValidacion } from './mensajes-de-validacion.js';

/**
 * Configuración única del `ValidationPipe` de la API.
 *
 * `main.ts` y los arneses e2e la comparten: si cada uno arma sus opciones, una
 * suite puede quedar en verde midiendo una configuración que ya no es la real.
 *
 * `forbidNonWhitelisted` rechaza la propiedad no declarada en el DTO en lugar de
 * descartarla en silencio, que es lo que vuelve diagnosticable un atributo mal
 * escrito (`AGENTS.md` §5.6 y §6.2).
 */
export function crearValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errores: ValidationError[]) =>
      new EntradaInvalidaException(detallesDeValidacion(errores)),
  });
}
