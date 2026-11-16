import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';
import { NOMBRES_PERMISO_REQUERIDOS } from '../../domain/catalogos.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { exigirNombreEditable } from '../../domain/services/nombres-requeridos.js';

export interface UpdatePermisoInput {
  id: number;
  nombre?: string;
  descripcion?: string | null;
  actorId?: number | null;
}

/** Edición de un permiso del catálogo. */
@Injectable()
export class UpdatePermisoUseCase {
  constructor(
    @Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository,
  ) {}

  async execute(input: UpdatePermisoInput): Promise<Permiso> {
    const permiso = await this.permisos.findById(input.id);

    if (permiso === null) {
      throw new ErrorSemantico(
        'no_encontrado',
        'PERMISO_NO_ENCONTRADO',
        'El permiso no existe.',
      );
    }

    if (input.nombre === undefined && input.descripcion === undefined) {
      throw new ErrorSemantico(
        'entrada_invalida',
        'SIN_CAMBIOS',
        'La edición requiere al menos un campo.',
      );
    }

    if (input.nombre !== undefined) {
      const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');

      exigirNombreEditable(permiso.nombre, nombre, NOMBRES_PERMISO_REQUERIDOS);

      if (await this.permisos.existeNombre(nombre, permiso.id)) {
        throw new ErrorSemantico('conflicto', 'PERMISO_DUPLICADO', `El permiso ${nombre} ya existe.`);
      }

      permiso.nombre = nombre;
    }

    if (input.descripcion !== undefined) {
      permiso.descripcion = input.descripcion;
    }

    permiso.updatedAt = new Date();
    permiso.updatedById = input.actorId ?? null;

    await this.permisos.save(permiso);

    return permiso;
  }
}
