import { describe, expect, it } from 'vitest';
import { CLAVE_PERMISO, RequierePermiso } from './requiere-permiso.decorator.js';

describe('RequierePermiso', () => {
  it('[identidad-usuario] adjunta el permiso al método', () => {
    class Controlador {
      @RequierePermiso('Crear plan')
      armar(this: void): void {}
    }

    expect(Reflect.getMetadata(CLAVE_PERMISO, Controlador.prototype.armar)).toBe('Crear plan');
  });

  it('[identidad-usuario] adjunta el permiso al controller', () => {
    @RequierePermiso('Gestionar alumnos')
    class Controlador {}

    expect(Reflect.getMetadata(CLAVE_PERMISO, Controlador)).toBe('Gestionar alumnos');
  });
});
