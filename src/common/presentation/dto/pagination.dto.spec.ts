import { describe, expect, it } from 'vitest';
import { EntradaInvalidaException } from '../../presentation/validation/entrada-invalida.exception.js';
import { crearValidationPipe } from '../../presentation/validation/validation-pipe.js';
import { PaginationDto } from './pagination.dto.js';

const METADATOS = { type: 'query' as const, metatype: PaginationDto };

async function transformar(valor: Record<string, unknown>): Promise<PaginationDto> {
  return (await crearValidationPipe().transform(valor, METADATOS)) as PaginationDto;
}

async function rechazar(valor: Record<string, unknown>): Promise<EntradaInvalidaException> {
  const error: unknown = await crearValidationPipe()
    .transform(valor, METADATOS)
    .catch((causa: unknown) => causa);

  expect(error).toBeInstanceOf(EntradaInvalidaException);

  return error as EntradaInvalidaException;
}

describe('PaginationDto', () => {
  it('[pagination] sin parámetros aplica la página 1 y el límite 10', async () => {
    await expect(transformar({})).resolves.toEqual({ page: 1, limit: 10 });
  });

  it('[pagination] convierte los valores del query string a números', async () => {
    await expect(transformar({ page: '2', limit: '25' })).resolves.toEqual({
      page: 2,
      limit: 25,
    });
  });

  it('[pagination] rechaza un límite mayor a 100', async () => {
    const error = await rechazar({ limit: '101' });

    expect(error.errores).toEqual([
      { campo: 'limit', mensaje: 'El límite no puede ser mayor a 100.' },
    ]);
  });

  it('[pagination] rechaza una página menor a 1', async () => {
    const error = await rechazar({ page: '0' });

    expect(error.errores).toEqual([
      { campo: 'page', mensaje: 'La página debe ser mayor o igual a 1.' },
    ]);
  });

  it('[pagination] rechaza un límite que no es entero', async () => {
    const error = await rechazar({ limit: '2.5' });

    expect(error.errores).toEqual([
      { campo: 'limit', mensaje: 'El límite debe ser un número entero.' },
    ]);
  });
});
