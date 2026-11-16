import { describe, expect, it } from 'vitest';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('[identidad-usuario] hashea con argon2id y los parámetros declarados', async () => {
    const hash = await hasher.hash('30123456');

    expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
  });

  it('[identidad-usuario] no contiene la contraseña en claro', async () => {
    const hash = await hasher.hash('30123456');

    expect(hash).not.toContain('30123456');
  });

  it('[identidad-usuario] usa una sal distinta por fila', async () => {
    const primero = await hasher.hash('30123456');
    const segundo = await hasher.hash('30123456');

    expect(primero).not.toBe(segundo);
  });

  it('[identidad-usuario] verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hasher.hash('30123456');

    await expect(hasher.verify(hash, '30123456')).resolves.toBe(true);
    await expect(hasher.verify(hash, '30123457')).resolves.toBe(false);
  });

  it('[identidad-usuario] un hash con formato desconocido no autentica', async () => {
    await expect(hasher.verify('no-es-un-hash', '30123456')).resolves.toBe(false);
  });
});
