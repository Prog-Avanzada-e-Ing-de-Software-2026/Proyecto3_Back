import { Inject, Injectable } from '@nestjs/common';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';

/**
 * Lectura de un permiso del catálogo por su nombre.
 *
 * Existe como operación de aplicación con nombre para que otros casos de uso
 * resuelvan permisos sin acoplarse al puerto de otro agregado.
 */
@Injectable()
export class FindPermisoByNombreUseCase {
  constructor(
    @Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository,
  ) {}

  async execute(nombre: string): Promise<Permiso | null> {
    return this.permisos.findByNombre(normalizarTextoObligatorio(nombre, 'NOMBRE'));
  }
}
