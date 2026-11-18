import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';

export interface CreatePermisoInput {
  nombre: string;
  descripcion?: string | null;
  actorId?: number | null;
}

/** Alta de un permiso del catálogo; el nombre no se libera con la baja. */
@Injectable()
export class CreatePermisoUseCase {
  constructor(
    @Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository,
  ) {}

  async execute(input: CreatePermisoInput): Promise<Permiso> {
    const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');

    if (await this.permisos.existeNombre(nombre)) {
      throw new ErrorSemantico('conflicto', 'PERMISO_DUPLICADO', `El permiso ${nombre} ya existe.`);
    }

    const permiso = Permiso.crear({
      nombre,
      descripcion: input.descripcion ?? null,
    });
    permiso.createdAt = new Date();
    permiso.createdById = input.actorId ?? null;

    await this.permisos.save(permiso);

    return permiso;
  }
}
