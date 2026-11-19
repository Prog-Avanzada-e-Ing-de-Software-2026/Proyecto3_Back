import { describe, expect, it } from 'vitest';
import { EntradaInvalidaException } from '../validation/entrada-invalida.exception.js';
import { crearValidationPipe } from '../validation/validation-pipe.js';
import { PaginacionQueryDto } from './paginacion-query.dto.js';

const METADATOS = { type: 'query' as const, metatype: PaginacionQueryDto };

async function validar(valor: Record<string, unknown>): Promise<unknown> {
  return crearValidationPipe()
    .transform(valor, METADATOS)
    .catch((causa: unknown) => causa);
}

describe('PaginacionQueryDto', () => {
  it('[catalogo] aplica los valores por defecto cuando no se envía nada', async () => {
    const resultado = (await validar({})) as PaginacionQueryDto;

    expect(resultado).toBeInstanceOf(PaginacionQueryDto);
    expect(resultado.skip).toBe(0);
    expect(resultado.take).toBe(10);
  });

  it('[catalogo] convierte los parámetros de la query de texto a número', async () => {
    const resultado = (await validar({ skip: '20', take: '5' })) as PaginacionQueryDto;

    expect(resultado.skip).toBe(20);
    expect(resultado.take).toBe(5);
  });

  it('[catalogo] rechaza un take mayor al máximo con el detalle del campo', async () => {
    const error = (await validar({ take: '500' })) as EntradaInvalidaException;

    expect(error).toBeInstanceOf(EntradaInvalidaException);
    expect(error.errores).toEqual([
      {
        campo: 'take',
        mensaje: 'La cantidad a traer debe ser un número entero entre 1 y 100.',
      },
    ]);
  });

  it('[catalogo] rechaza un take en cero', async () => {
    const error = (await validar({ take: '0' })) as EntradaInvalidaException;

    expect(error).toBeInstanceOf(EntradaInvalidaException);
    expect(error.errores).toEqual([
      {
        campo: 'take',
        mensaje: 'La cantidad a traer debe ser un número entero entre 1 y 100.',
      },
    ]);
  });

  it('[catalogo] rechaza un skip negativo', async () => {
    const error = (await validar({ skip: '-1' })) as EntradaInvalidaException;

    expect(error).toBeInstanceOf(EntradaInvalidaException);
    expect(error.errores).toEqual([
      {
        campo: 'skip',
        mensaje: 'El desplazamiento debe ser un número entero mayor o igual a 0.',
      },
    ]);
  });

  it('[catalogo] rechaza un skip que no es un número', async () => {
    const error = (await validar({ skip: 'abc' })) as EntradaInvalidaException;

    expect(error).toBeInstanceOf(EntradaInvalidaException);
    expect(error.errores).toEqual([
      {
        campo: 'skip',
        mensaje: 'El desplazamiento debe ser un número entero mayor o igual a 0.',
      },
    ]);
  });
});
