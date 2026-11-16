import { describe, expect, it } from 'vitest';
import { leerConfiguracionSesion } from './jwt-config.js';

const ACCESO = 'a'.repeat(32);
const REFRESCO = 'b'.repeat(32);

function entorno(valores: Record<string, string>): NodeJS.ProcessEnv {
  return valores as NodeJS.ProcessEnv;
}

function valido(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return entorno({
    AUTH_JWT_SECRET_ACCESS: ACCESO,
    AUTH_JWT_SECRET_REFRESH: REFRESCO,
    ...extra,
  });
}

describe('leerConfiguracionSesion', () => {
  it('[implement-login] rechaza el secreto de access ausente', () => {
    expect(() =>
      leerConfiguracionSesion(entorno({ AUTH_JWT_SECRET_REFRESH: REFRESCO })),
    ).toThrow(/AUTH_JWT_SECRET_ACCESS/);
  });

  it('[implement-login] rechaza el secreto de refresh ausente', () => {
    expect(() =>
      leerConfiguracionSesion(entorno({ AUTH_JWT_SECRET_ACCESS: ACCESO })),
    ).toThrow(/AUTH_JWT_SECRET_REFRESH/);
  });

  it('[implement-login] rechaza un secreto de menos de 32 caracteres', () => {
    expect(() =>
      leerConfiguracionSesion(entorno({ AUTH_JWT_SECRET_ACCESS: 'corto', AUTH_JWT_SECRET_REFRESH: REFRESCO })),
    ).toThrow(/AUTH_JWT_SECRET_ACCESS/);
  });

  it('[implement-login] rechaza el mismo secreto para los dos tipos', () => {
    expect(() =>
      leerConfiguracionSesion(
        entorno({ AUTH_JWT_SECRET_ACCESS: ACCESO, AUTH_JWT_SECRET_REFRESH: ACCESO }),
      ),
    ).toThrow(/distinto/i);
  });

  it('[implement-login] recorta los espacios de los secretos', () => {
    const configuracion = leerConfiguracionSesion(
      entorno({
        AUTH_JWT_SECRET_ACCESS: `  ${ACCESO}  `,
        AUTH_JWT_SECRET_REFRESH: `  ${REFRESCO}  `,
      }),
    );

    expect(configuracion.secretoAccess).toBe(ACCESO);
    expect(configuracion.secretoRefresh).toBe(REFRESCO);
  });

  it('[implement-login] usa los vencimientos por defecto cuando no están en el entorno', () => {
    const configuracion = leerConfiguracionSesion(valido());

    expect(configuracion.ttlAccess).toBe(15 * 60);
    expect(configuracion.ttlRefresh).toBe(7 * 24 * 60 * 60);
  });

  it('[implement-login] toma los vencimientos del entorno', () => {
    const configuracion = leerConfiguracionSesion(
      valido({ AUTH_ACCESS_TTL_SEGUNDOS: '600', AUTH_REFRESH_TTL_SEGUNDOS: '86400' }),
    );

    expect(configuracion.ttlAccess).toBe(600);
    expect(configuracion.ttlRefresh).toBe(86400);
  });

  it('[implement-login] rechaza un vencimiento que no es entero positivo', () => {
    expect(() =>
      leerConfiguracionSesion(valido({ AUTH_ACCESS_TTL_SEGUNDOS: 'quince' })),
    ).toThrow(/AUTH_ACCESS_TTL_SEGUNDOS/);
    expect(() => leerConfiguracionSesion(valido({ AUTH_ACCESS_TTL_SEGUNDOS: '0' }))).toThrow(
      /AUTH_ACCESS_TTL_SEGUNDOS/,
    );
    expect(() =>
      leerConfiguracionSesion(valido({ AUTH_REFRESH_TTL_SEGUNDOS: '-5' })),
    ).toThrow(/AUTH_REFRESH_TTL_SEGUNDOS/);
  });

  it('[implement-login] rechaza un refresh que no dura más que el access', () => {
    expect(() =>
      leerConfiguracionSesion(
        valido({ AUTH_ACCESS_TTL_SEGUNDOS: '900', AUTH_REFRESH_TTL_SEGUNDOS: '900' }),
      ),
    ).toThrow(/AUTH_REFRESH_TTL_SEGUNDOS/);
  });
});
