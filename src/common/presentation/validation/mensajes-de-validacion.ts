import { ValidationTypes } from 'class-validator';
import type { ValidationError } from 'class-validator';
import type { DetalleValidacion } from './detalle-validacion.js';

/**
 * Redacción de las restricciones que no vienen de un decorador del DTO.
 *
 * `whitelist` la inyecta el propio `ValidationPipe` cuando una propiedad del
 * cuerpo no está declarada, así que no hay decorador donde escribir su mensaje.
 * La clave se toma de `ValidationTypes` porque el identificador real
 * (`whitelistValidation`) no es el nombre público de la restricción.
 */
const MENSAJES_DEL_PIPE: Record<string, (campo: string) => string> = {
  [ValidationTypes.WHITELIST]: (campo) =>
    `La propiedad "${campo}" no está admitida en la solicitud.`,
};

interface DetalleInterno extends DetalleValidacion {
  restriccion: string;
}

/**
 * Convierte los errores del `ValidationPipe` en el detalle que viaja al cliente.
 *
 * El mensaje se toma tal cual lo resolvió `class-validator`: es el `message`
 * declarado en el decorador del DTO. Se emite una entrada por restricción
 * incumplida, los DTO anidados se componen con puntos y el resultado se ordena
 * por campo y restricción para que dos solicitudes equivalentes respondan igual.
 */
export function detallesDeValidacion(
  errores: ValidationError[],
): DetalleValidacion[] {
  return errores
    .flatMap((error) => detallesDe(error, ''))
    .sort(
      (a, b) =>
        a.campo.localeCompare(b.campo, 'es') ||
        a.restriccion.localeCompare(b.restriccion, 'es'),
    )
    .map(({ campo, mensaje }) => ({ campo, mensaje }));
}

function detallesDe(error: ValidationError, prefijo: string): DetalleInterno[] {
  const campo =
    prefijo === '' ? error.property : `${prefijo}.${error.property}`;

  const propios = Object.entries(error.constraints ?? {}).map(
    ([restriccion, mensaje]) => ({
      campo,
      mensaje: MENSAJES_DEL_PIPE[restriccion]?.(campo) ?? mensaje,
      restriccion,
    }),
  );

  const anidados = (error.children ?? []).flatMap((hijo) =>
    detallesDe(hijo, campo),
  );

  return [...propios, ...anidados];
}
