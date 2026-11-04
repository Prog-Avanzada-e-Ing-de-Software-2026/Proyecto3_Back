import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { CreateRolUseCase } from './create-rol.use-case.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

const alta = new Date('2026-01-01T10:00:00.000Z');

class PermisoRepositoryFalso implements IPermisoRepository {
  readonly guardados: Permiso[] = [];
  private readonly porNombre = new Map<string, Permiso>();

  async save(permiso: Permiso): Promise<void> {
    this.guardados.push(permiso);
    this.porNombre.set(permiso.nombre, permiso);
  }

  async findByNombre(nombre: string): Promise<Permiso | null> {
    return this.porNombre.get(nombre) ?? null;
  }

  precargar(permiso: Permiso): void {
    this.porNombre.set(permiso.nombre, permiso);
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

function crearPermiso(nombre: string): Permiso {
  return Permiso.crear({ nombre, createdAt: alta, createdById: null });
}

beforeAll(() => {
  initOrmMetadata();
});

describe('CreateRolUseCase', () => {
  it('[create-rol] crea el rol con los permisos que resolvió el puerto', async () => {
    const permisos = new PermisoRepositoryFalso();
    const roles = new RolRepositoryFalso();
    const permiso = crearPermiso('Crear plan');
    permisos.precargar(permiso);
    const caso = new CreateRolUseCase(roles, new FindPermisoByNombreUseCase(permisos));

    const rol = await caso.execute({
      codigo: 'profesor',
      nombre: 'Profesor',
      permisos: ['Crear plan'],
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
    const permiso = crearPermiso('Crear plan');
    permisos.precargar(permiso);
    const caso = new CreateRolUseCase(roles, new FindPermisoByNombreUseCase(permisos));
    const existente = await caso.execute({
      codigo: 'PROFESOR',
      nombre: 'Profesor',
      permisos: ['Crear plan'],
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
    const caso = new CreateRolUseCase(roles, new FindPermisoByNombreUseCase(permisos));

    await expect(
      caso.execute({ codigo: 'PROFESOR', nombre: 'Profesor', permisos: ['Inexistente'] }),
    ).rejects.toThrow(ErrorSemantico);
    expect(roles.guardados).toHaveLength(0);
  });

  it('[create-rol] un rol sin permisos es válido', async () => {
    const permisos = new PermisoRepositoryFalso();
    const roles = new RolRepositoryFalso();
    const caso = new CreateRolUseCase(roles, new FindPermisoByNombreUseCase(permisos));

    const rol = await caso.execute({ codigo: 'ALUMNO', nombre: 'Alumno', permisos: [] });

    expect(rol.permisos.getItems()).toEqual([]);
    expect(roles.guardados).toHaveLength(1);
  });
});
