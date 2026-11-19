import type { ValidationError } from 'class-validator';
import { ValidationTypes } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { detallesDeValidacion } from './mensajes-de-validacion.js';

function errorDeValidacion(datos: Partial<ValidationError>): ValidationError {
  return {
    target: {},
    property: '',
    value: undefined,
    children: [],
    ...datos,
  } as unknown as ValidationError;
}

describe('detallesDeValidacion', () => {
  it('[http-error-contract] transporta literal el mensaje declarado en el decorador', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'email',
        constraints: { isEmail: 'El email no tiene un formato válido.' },
      }),
    ]);

    expect(detalles).toEqual([
      { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
    ]);
  });

  it('[http-error-contract] emite una entrada por restriccion incumplida en orden estable', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'password',
        constraints: {
          isString: 'La contraseña debe ser un texto.',
          isNotEmpty: 'La contraseña es obligatoria.',
        },
      }),
    ]);

    expect(detalles).toEqual([
      { campo: 'password', mensaje: 'La contraseña es obligatoria.' },
      { campo: 'password', mensaje: 'La contraseña debe ser un texto.' },
    ]);
  });

  it('[http-error-contract] ordena por campo aunque el origen llegue desordenado', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'password',
        constraints: { isNotEmpty: 'Falta la contraseña.' },
      }),
      errorDeValidacion({
        property: 'email',
        constraints: { isEmail: 'Email inválido.' },
      }),
    ]);

    expect(detalles.map((detalle) => detalle.campo)).toEqual([
      'email',
      'password',
    ]);
  });

  it('[http-error-contract] traduce la restriccion whitelist con el texto central', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'correo',
        constraints: {
          [ValidationTypes.WHITELIST]: 'property correo should not exist',
        },
      }),
    ]);

    expect(detalles).toEqual([
      {
        campo: 'correo',
        mensaje: 'La propiedad "correo" no está admitida en la solicitud.',
      },
    ]);
  });

  it('[http-error-contract] compone el campo de un DTO anidado con puntos', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'direccion',
        constraints: {},
        children: [
          errorDeValidacion({
            property: 'calle',
            constraints: { isNotEmpty: 'La calle es obligatoria.' },
          }),
        ],
      }),
    ]);

    expect(detalles).toEqual([
      { campo: 'direccion.calle', mensaje: 'La calle es obligatoria.' },
    ]);
  });

  it('[http-error-contract] colapsa dos restricciones del mismo campo con el mismo texto', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'take',
        constraints: {
          isInt: 'La cantidad a traer debe ser un número entero entre 1 y 100.',
          min: 'La cantidad a traer debe ser un número entero entre 1 y 100.',
          max: 'La cantidad a traer debe ser un número entero entre 1 y 100.',
        },
      }),
    ]);

    expect(detalles).toEqual([
      {
        campo: 'take',
        mensaje: 'La cantidad a traer debe ser un número entero entre 1 y 100.',
      },
    ]);
  });

  it('[http-error-contract] no incluye el valor recibido en el detalle', () => {
    const detalles = detallesDeValidacion([
      errorDeValidacion({
        property: 'email',
        value: 'valor-secreto',
        constraints: { isEmail: 'El email no tiene un formato válido.' },
      }),
    ]);

    expect(JSON.stringify(detalles)).not.toContain('valor-secreto');
  });
});
