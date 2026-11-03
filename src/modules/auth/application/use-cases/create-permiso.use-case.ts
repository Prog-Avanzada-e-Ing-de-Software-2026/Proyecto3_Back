import { Inject, Injectable } from '@nestjs/common';
import { normalizarCodigo } from '../../../../common/domain/validaciones.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { PERMISO_REPOSITORY } from '../../auth.tokens.js';

export interface CreatePermisoInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Alta idempotente de un permiso del catálogo.
 *
 * Si el código ya existe no escribe: la carga inicial puede repetirse sin
 * duplicar filas.
 */
@Injectable()
export class CreatePermisoUseCase {
  constructor(
    @Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository,
  ) {}

  async execute(input: CreatePermisoInput): Promise<Permiso> {
    const codigo = normalizarCodigo(input.codigo);
    const existente = await this.permisos.findByCodigo(codigo);

    if (existente !== null) {
      return existente;
    }

    const permiso = Permiso.crear({
      codigo,
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
      createdAt: new Date(),
      createdById: null,
    });

    await this.permisos.save(permiso);

    return permiso;
  }
}
