import { describe, expect, it } from 'vitest';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { NOMBRES_PERMISO_REQUERIDOS, NOMBRES_ROL_REQUERIDOS } from '../catalogos.js';
import { exigirNombreEditable } from './nombres-requeridos.js';

describe('exigirNombreEditable', () => {
  it('[identidad-usuario] acepta cambiar un nombre que no es requerido', () => {
    expect(() =>
      exigirNombreEditable('Entrenador', 'Coach', NOMBRES_ROL_REQUERIDOS),
    ).not.toThrow();
  });

  it('[identidad-usuario] acepta la edición cuando el nombre no cambia', () => {
    expect(() =>
      exigirNombreEditable('Administrador', 'Administrador', NOMBRES_ROL_REQUERIDOS),
    ).not.toThrow();
  });

  it('[identidad-usuario] rechaza renombrar un rol requerido', () => {
    expect(() =>
      exigirNombreEditable('Administrador', 'Admin', NOMBRES_ROL_REQUERIDOS),
    ).toThrow(ErrorSemantico);
  });

  it('[identidad-usuario] rechaza renombrar un permiso requerido', () => {
    expect(() =>
      exigirNombreEditable(
        'rol:consultar',
        'Administrar roles',
        NOMBRES_PERMISO_REQUERIDOS,
      ),
    ).toThrow(ErrorSemantico);
  });
});
