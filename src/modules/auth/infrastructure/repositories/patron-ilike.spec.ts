import { describe, expect, it } from 'vitest';
import { patronSinComodines } from './patron-ilike.js';

describe('patronSinComodines', () => {
  it('[identidad-usuario] escapa % para que no actúe como comodín', () => {
    expect(patronSinComodines('50%')).toBe('50\\%');
  });

  it('[identidad-usuario] escapa _ para que no actúe como comodín', () => {
    expect(patronSinComodines('a_b')).toBe('a\\_b');
  });

  it('[identidad-usuario] escapa \\ para no romper el patrón', () => {
    expect(patronSinComodines('a\\b')).toBe('a\\\\b');
  });

  it('[identidad-usuario] deja intacto un nombre sin caracteres especiales', () => {
    expect(patronSinComodines('plan:crear')).toBe('plan:crear');
  });
});
