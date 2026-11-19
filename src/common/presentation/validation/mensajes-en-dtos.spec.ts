/// <reference types="vite/client" />
import { ValidationTypes, getMetadataStorage } from 'class-validator';
import { describe, expect, it } from 'vitest';

/**
 * Gate de redacción: el mensaje que ve el cliente vive en el decorador del DTO,
 * así que un decorador sin `message` expondría el texto inglés de
 * `class-validator`. El test recorre todos los DTO del proyecto para que un DTO
 * nuevo quede cubierto sin registrar nada a mano. Comprueba que el mensaje
 * exista; que su redacción sea la correcta en español es revisión humana.
 */
const modulosDto = import.meta.glob(
  '/src/**/dto/*.dto.ts',
  { eager: true },
);

/** Metadatos que no producen restricción y por lo tanto no llevan mensaje. */
const SIN_RESTRICCION = new Set<string>([
  ValidationTypes.CONDITIONAL_VALIDATION,
  ValidationTypes.NESTED_VALIDATION,
  ValidationTypes.PROMISE_VALIDATION,
  ValidationTypes.WHITELIST,
]);

describe('Mensajes de validación de los DTO', () => {
  it('[http-error-contract] cada decorador de validación declara su message en español', () => {
    const incumplimientos: string[] = [];
    let dtoComprobados = 0;

    for (const [ruta, modulo] of Object.entries(modulosDto)) {
      const clases = Object.values(modulo as Record<string, unknown>).filter(
        (exportado): exportado is Function => typeof exportado === 'function',
      );

      let encontroRestricciones = false;

      for (const clase of clases) {
        const metadatos = getMetadataStorage().getTargetValidationMetadatas(
          clase,
          '',
          false,
          false,
        );
        const restricciones = metadatos.filter(
          (metadato) => !SIN_RESTRICCION.has(metadato.type),
        );

        if (restricciones.length === 0) {
          continue;
        }

        encontroRestricciones = true;
        dtoComprobados += 1;

        for (const restriccion of restricciones) {
          const mensaje = restriccion.message;
          const origen = `${ruta}: ${clase.name}.${restriccion.propertyName} (${restriccion.name ?? restriccion.type})`;

          if (typeof mensaje !== 'string' || mensaje.trim() === '') {
            incumplimientos.push(`${origen} no declara un message de texto`);
            continue;
          }

          if (/\$(value|property)/.test(mensaje)) {
            incumplimientos.push(`${origen} interpola un placeholder de class-validator`);
          }
        }
      }

      if (!encontroRestricciones) {
        incumplimientos.push(
          `${ruta}: no declara ninguna clase de DTO con decoradores de validación`,
        );
      }
    }

    expect(dtoComprobados).toBeGreaterThan(0);
    expect(incumplimientos).toEqual([]);
  });
});
