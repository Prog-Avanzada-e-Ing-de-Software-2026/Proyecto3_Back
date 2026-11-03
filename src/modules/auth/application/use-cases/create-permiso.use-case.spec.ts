import { beforeAll, describe, expect, it } from 'vitest';
import { initOrmMetadata } from '../../../../../test/support/orm-metadata.js';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { CreatePermisoUseCase } from './create-permiso.use-case.js';

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

beforeAll(() => {
  initOrmMetadata();
});

describe('CreatePermisoUseCase', () => {
  it('[create-permiso] crea el permiso cuando el código no existe', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const caso = new CreatePermisoUseCase(repositorio);

    const permiso = await caso.execute({ codigo: ' crear_plan ', nombre: 'Crear plan' });

    expect(repositorio.guardados).toHaveLength(1);
    expect(permiso.codigo).toBe('CREAR_PLAN');
    expect(permiso.nombre).toBe('Crear plan');
    expect(permiso.createdById).toBeNull();
    expect(permiso.createdAt).toBeInstanceOf(Date);
    expect(permiso.updatedAt).toBeNull();
  });

  it('[create-permiso] no escribe cuando el código ya existe', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const caso = new CreatePermisoUseCase(repositorio);
    const existente = await caso.execute({ codigo: 'CREAR_PLAN', nombre: 'Crear plan' });
    const guardadosAntes = repositorio.guardados.length;

    const resultado = await caso.execute({ codigo: 'crear_plan', nombre: 'Otro nombre' });

    expect(resultado).toBe(existente);
    expect(repositorio.guardados).toHaveLength(guardadosAntes);
  });

  it('[create-permiso] rechaza el código vacío sin escribir', async () => {
    const repositorio = new PermisoRepositoryFalso();
    const caso = new CreatePermisoUseCase(repositorio);

    await expect(caso.execute({ codigo: '  ', nombre: 'Crear plan' })).rejects.toThrow(
      ErrorSemantico,
    );
    expect(repositorio.guardados).toHaveLength(0);
  });
});
