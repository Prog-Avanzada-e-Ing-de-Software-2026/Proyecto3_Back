import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { exigirPermisosOtorgables } from './permisos-otorgables.js';

beforeAll(() => {
  initOrmMetadata();
});

function permiso(nombre: string): Permiso {
  return Permiso.crear({ nombre });
}

function usuarioCon(nombresPermisos: string[]): Usuario {
  const rol = Rol.crear({
    nombre: 'un-rol',
    permisos: nombresPermisos.map((nombre) => permiso(nombre)),
  });

  return Usuario.crear({ email: 'actor@gym.com', passwordHash: 'hash', rol });
}

describe('exigirPermisosOtorgables', () => {
  it('[identidad-usuario] acepta cuando el actor tiene todos los permisos pedidos', () => {
    expect(() =>
      exigirPermisosOtorgables(usuarioCon(['Crear plan', 'Gestionar roles']), [
        permiso('Crear plan'),
      ]),
    ).not.toThrow();
  });

  it('[identidad-usuario] acepta un conjunto vacío', () => {
    expect(() => exigirPermisosOtorgables(usuarioCon([]), [])).not.toThrow();
  });

  it('[identidad-usuario] rechaza un permiso que el actor no tiene', () => {
    expect(() =>
      exigirPermisosOtorgables(usuarioCon(['Gestionar roles']), [
        permiso('Gestionar roles'),
        permiso('Gestionar permisos'),
      ]),
    ).toThrow(ErrorSemantico);
  });

  it('[identidad-usuario] usa los permisos efectivos, que excluyen los dados de baja', () => {
    const vigente = permiso('Gestionar roles');
    const dadoDeBaja = permiso('Gestionar permisos');
    dadoDeBaja.deletedAt = new Date('2026-03-01T10:00:00.000Z');
    const rol = Rol.crear({ nombre: 'Administrador', permisos: [vigente, dadoDeBaja] });
    const actor = Usuario.crear({ email: 'actor@gym.com', passwordHash: 'hash', rol });

    expect(() => exigirPermisosOtorgables(actor, [dadoDeBaja])).toThrow(ErrorSemantico);
  });
});
