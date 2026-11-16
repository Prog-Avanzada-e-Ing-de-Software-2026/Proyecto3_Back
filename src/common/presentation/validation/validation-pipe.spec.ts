import { IsEmail, IsString } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { EntradaInvalidaException } from './entrada-invalida.exception.js';
import { crearValidationPipe } from './validation-pipe.js';

/**
 * DTO local: el test ejercita la configuración del pipe, no un contrato de
 * módulo. Los DTO reales quedan cubiertos por las suites e2e.
 */
class CuerpoDePrueba {
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  @IsString({ message: 'La clave debe ser un texto.' })
  clave!: string;
}

const METADATOS = { type: 'body' as const, metatype: CuerpoDePrueba };

describe('crearValidationPipe', () => {
  it('[http-error-contract] transforma un cuerpo valido en la instancia del DTO', async () => {
    const pipe = crearValidationPipe();

    const resultado = await pipe.transform(
      { email: 'alumno@gym.com', clave: '30123456' },
      METADATOS,
    );

    expect(resultado).toBeInstanceOf(CuerpoDePrueba);
    expect(resultado).toEqual({ email: 'alumno@gym.com', clave: '30123456' });
  });

  it('[http-error-contract] rechaza una propiedad no declarada con el detalle por campo', async () => {
    const pipe = crearValidationPipe();

    const error: unknown = await pipe
      .transform({ email: 'alumno@gym.com', clave: '30123456', correo: 'x' }, METADATOS)
      .catch((causa: unknown) => causa);

    expect(error).toBeInstanceOf(EntradaInvalidaException);
    expect((error as EntradaInvalidaException).errores).toEqual([
      { campo: 'correo', mensaje: 'La propiedad "correo" no está admitida en la solicitud.' },
    ]);
  });

  it('[http-error-contract] transporta el mensaje del decorador en el detalle', async () => {
    const pipe = crearValidationPipe();

    const error: unknown = await pipe
      .transform({ email: 'sin-arroba', clave: '30123456' }, METADATOS)
      .catch((causa: unknown) => causa);

    expect((error as EntradaInvalidaException).errores).toEqual([
      { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
    ]);
  });
});
