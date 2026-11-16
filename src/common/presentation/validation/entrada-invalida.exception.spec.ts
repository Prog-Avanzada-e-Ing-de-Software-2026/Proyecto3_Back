import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  EntradaInvalidaException,
  esErrorConDetalle,
} from './entrada-invalida.exception.js';

describe('EntradaInvalidaException', () => {
  it('[http-error-contract] responde 400 y expone el detalle recibido', () => {
    const errores = [
      { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
    ];

    const excepcion = new EntradaInvalidaException(errores);

    expect(excepcion.getStatus()).toBe(400);
    expect(excepcion.errores).toEqual(errores);
  });

  it('[http-error-contract] el guard reconoce el detalle y descarta otra excepcion HTTP', () => {
    expect(esErrorConDetalle(new EntradaInvalidaException([]))).toBe(true);
    expect(esErrorConDetalle(new BadRequestException('otra causa'))).toBe(
      false,
    );
    expect(esErrorConDetalle(new Error('inesperado'))).toBe(false);
    expect(esErrorConDetalle(null)).toBe(false);
  });

  it('[http-error-contract] repite el mensaje del 400 que responde el filtro', () => {
    expect(new EntradaInvalidaException([]).message).toBe(
      'La solicitud no es válida.',
    );
  });
});
