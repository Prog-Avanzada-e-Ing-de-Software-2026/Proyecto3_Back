import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import { NOMBRES_ROL_REQUERIDOS } from '../../domain/catalogos.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { exigirNombreEditable } from '../../domain/services/nombres-requeridos.js';

export interface UpdateRolInput {
  id: number;
  nombre?: string;
  descripcion?: string | null;
  actorId?: number | null;
}

/**
 * Edición de un rol del catálogo.
 *
 * No toca la asignación de permisos: eso es una operación propia, para que una
 * edición de nombre o descripción no pueda alterar quién puede qué.
 */
@Injectable()
export class UpdateRolUseCase {
  constructor(@Inject(ROL_REPOSITORY) private readonly roles: IRolRepository) {}

  async execute(input: UpdateRolInput): Promise<Rol> {
    const rol = await this.roles.findById(input.id);

    if (rol === null) {
      throw new ErrorSemantico('no_encontrado', 'ROL_NO_ENCONTRADO', 'El rol no existe.');
    }

    if (input.nombre !== undefined) {
      const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');

      exigirNombreEditable(rol.nombre, nombre, NOMBRES_ROL_REQUERIDOS);

      if (await this.roles.existeNombre(nombre, rol.id)) {
        throw new ErrorSemantico('conflicto', 'ROL_DUPLICADO', `El rol ${nombre} ya existe.`);
      }

      rol.nombre = nombre;
    }

    if (input.descripcion !== undefined) {
      rol.descripcion = input.descripcion;
    }

    rol.updatedAt = new Date();
    rol.updatedById = input.actorId ?? null;

    await this.roles.save(rol);

    return rol;
  }
}
