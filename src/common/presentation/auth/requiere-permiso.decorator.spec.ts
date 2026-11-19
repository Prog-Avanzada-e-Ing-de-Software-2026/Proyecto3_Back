import { describe, expect, it } from 'vitest';
import { CLAVE_PERMISO, RequierePermiso } from './requiere-permiso.decorator.js';

describe('RequierePermiso', () => {
  it('[identidad-usuario] adjunta el permiso al método', () => {
    class Controlador {
      @RequierePermiso('plan:crear')
      armar(this: void): void {}
    }

    expect(Reflect.getMetadata(CLAVE_PERMISO, Controlador.prototype.armar)).toBe('plan:crear');
  });

  it('[identidad-usuario] adjunta el permiso al controller', () => {
    @RequierePermiso('alumno:consultar')
    class Controlador {}

    expect(Reflect.getMetadata(CLAVE_PERMISO, Controlador)).toBe('alumno:consultar');
  });
});
