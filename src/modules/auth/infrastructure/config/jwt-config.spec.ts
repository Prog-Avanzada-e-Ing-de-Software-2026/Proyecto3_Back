import { describe, expect, it } from 'vitest';
import { leerSecretoJwt } from './jwt-config.js';

describe('leerSecretoJwt', () => {
  it('[implement-login] rechaza el secreto ausente del entorno', () => {
    const original = process.env.AUTH_JWT_SECRET;

    delete process.env.AUTH_JWT_SECRET;

    try {
      expect(() => leerSecretoJwt()).toThrow(/AUTH_JWT_SECRET/);
    } finally {
      process.env.AUTH_JWT_SECRET = original;
    }
  });

  it('[implement-login] rechaza un secreto vacío o demasiado corto', () => {
    expect(() => leerSecretoJwt('   ')).toThrow(/AUTH_JWT_SECRET/);
    expect(() => leerSecretoJwt('secreto-corto')).toThrow(/AUTH_JWT_SECRET/);
  });

  it('[implement-login] acepta un secreto de 32 caracteres y descarta los espacios', () => {
    expect(leerSecretoJwt(`  ${'a'.repeat(32)}  `)).toBe('a'.repeat(32));
  });
});
