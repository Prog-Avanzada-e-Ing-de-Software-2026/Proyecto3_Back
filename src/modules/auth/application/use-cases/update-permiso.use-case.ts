import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';
import { NOMBRES_PERMISO_REQUERIDOS } from '../../domain/catalogos.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { exigirNombreEditable } from '../../domain/services/nombres-requeridos.js';
import type { UpdatePermisoDto } from '../../presentation/dto/update-permiso.dto.js';

/** Edición de un permiso del catálogo. */
@Injectable()
export class UpdatePermisoUseCase {
  constructor(
    @Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository,
  ) {}

  async execute(id: number, dto: UpdatePermisoDto, actorId?: number | null): Promise<Permiso> {
    const permiso = await this.permisos.findById(id);

    if (permiso === null) {
      throw new ErrorSemantico(
        'no_encontrado',
        'PERMISO_NO_ENCONTRADO',
        'El permiso no existe.',
      );
    }

    if (dto.nombre === undefined && dto.descripcion === undefined) {
      throw new ErrorSemantico(
        'entrada_invalida',
        'SIN_CAMBIOS',
        'La edición requiere al menos un campo.',
      );
    }

    if (dto.nombre !== undefined) {
      const nombre = normalizarTextoObligatorio(dto.nombre, 'NOMBRE');

      exigirNombreEditable(permiso.nombre, nombre, NOMBRES_PERMISO_REQUERIDOS);

      if (await this.permisos.existeNombre(nombre, permiso.id)) {
        throw new ErrorSemantico('conflicto', 'PERMISO_DUPLICADO', `El permiso ${nombre} ya existe.`);
      }

      permiso.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      permiso.descripcion = dto.descripcion;
    }

    permiso.updatedAt = new Date();
    permiso.updatedById = actorId ?? null;

    await this.permisos.save(permiso);

    return permiso;
  }
}
