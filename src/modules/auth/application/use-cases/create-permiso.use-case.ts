import { Inject, Injectable } from '@nestjs/common';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';

export interface CreatePermisoInput {
  nombre: string;
  descripcion?: string | null;
}

/**
 * Alta idempotente de un permiso del catálogo.
 *
 * Si el nombre ya existe no escribe: la carga inicial puede repetirse sin
 * duplicar filas.
 */
@Injectable()
export class CreatePermisoUseCase {
  constructor(
    @Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository,
  ) {}

  async execute(input: CreatePermisoInput): Promise<Permiso> {
    const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');
    const existente = await this.permisos.findByNombre(nombre);

    if (existente !== null) {
      return existente;
    }

    const permiso = Permiso.crear({
      nombre,
      descripcion: input.descripcion ?? null,
      createdAt: new Date(),
      createdById: null,
    });

    await this.permisos.save(permiso);

    return permiso;
  }
}
