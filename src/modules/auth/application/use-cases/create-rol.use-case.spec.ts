import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { CreateRolUseCase } from './create-rol.use-case.js';

const alta = new Date('2026-01-01T10:00:00.000Z');

class PermisoRepositoryFalso implements IPermisoRepository {
  readonly guardados: Permiso[] = [];
  private readonly porCodigo = new Map<string, Permiso>();

  async save(permiso: Permiso): Promise<void> {
    this.guardados.push(permiso);
    this.porCodigo.set(permiso.codigo, permiso);
  }

  async findByCodigo(codigo: string): Promise<Permiso | null> {
    return this.porCodigo.get(codigo) ?? null;
  }

  precargar(permiso: Permiso): void {
    this.porCodigo.set(permiso.codigo, permiso);
  }
}

class RolRepositoryFalso implements IRolRepository {
  readonly guardados: Rol[] = [];
  private readonly porCodigo = new Map<string, Rol>();

  async save(rol: Rol): Promise<void> {
    this.guardados.push(rol);
    this.porCodigo.set(rol.codigo, rol);
  }

  async findByCodigo(codigo: string): Promise<Rol | null> {
    return this.porCodigo.get(codigo) ?? null;
  }

  precargar(rol: Rol): void {
    this.porCodigo.set(rol.codigo, rol);
  }
}

function crearPermiso(codigo: string): Permiso {
  return Permiso.crear({ codigo, nombre: codigo, createdAt: alta, createdById: null });
}

beforeAll(() => {
  initOrmMetadata();
});

describe('CreateRolUseCase', () => {
  it('[create-rol] crea el rol con los permisos que resolvió el puerto', async () => {
    const permisos = new PermisoRepositoryFalso();
    const roles = new RolRepositoryFalso();
    const permiso = crearPermiso('CREAR_PLAN');
    permisos.precargar(permiso);
    const caso = new CreateRolUseCase(roles, permisos);

    const rol = await caso.execute({
      codigo: 'profesor',
      nombre: 'Profesor',
      permisos: ['CREAR_PLAN'],
    });

    expect(roles.guardados).toHaveLength(1);
    expect(rol.codigo).toBe('PROFESOR');
    expect(rol.permisos.getItems()).toEqual([permiso]);
    expect(rol.createdById).toBeNull();
    expect(rol.createdAt).toBeInstanceOf(Date);
    expect(rol.updatedAt).toBeNull();
  });

  it('[create-rol] no escribe cuando el código del rol ya existe', async () => {
    const permisos = new PermisoRepositoryFalso();
    const roles = new RolRepositoryFalso();
    const permiso = crearPermiso('CREAR_PLAN');
    permisos.precargar(permiso);
    const caso = new CreateRolUseCase(roles, permisos);
    const existente = await caso.execute({
      codigo: 'PROFESOR',
      nombre: 'Profesor',
      permisos: ['CREAR_PLAN'],
    });

    const resultado = await caso.execute({
      codigo: 'profesor',
      nombre: 'Otro nombre',
      permisos: [],
    });

    expect(resultado).toBe(existente);
    expect(roles.guardados).toHaveLength(1);
  });

  it('[create-rol] rechaza un permiso inexistente antes de escribir', async () => {
    const permisos = new PermisoRepositoryFalso();
    const roles = new RolRepositoryFalso();
    const caso = new CreateRolUseCase(roles, permisos);

    await expect(
      caso.execute({ codigo: 'PROFESOR', nombre: 'Profesor', permisos: ['INEXISTENTE'] }),
    ).rejects.toThrow(ErrorSemantico);
    expect(roles.guardados).toHaveLength(0);
  });

  it('[create-rol] un rol sin permisos es válido', async () => {
    const permisos = new PermisoRepositoryFalso();
    const roles = new RolRepositoryFalso();
    const caso = new CreateRolUseCase(roles, permisos);

    const rol = await caso.execute({ codigo: 'ALUMNO', nombre: 'Alumno', permisos: [] });

    expect(rol.permisos.getItems()).toEqual([]);
    expect(roles.guardados).toHaveLength(1);
  });
});
