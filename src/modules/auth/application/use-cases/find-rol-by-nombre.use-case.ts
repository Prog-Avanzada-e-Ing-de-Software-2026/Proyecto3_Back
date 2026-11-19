import { Inject, Injectable } from '@nestjs/common';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';

/** Lectura de un rol del catálogo por su nombre, sin distinguir mayúsculas. */
@Injectable()
export class FindRolByNombreUseCase {
  constructor(@Inject(ROL_REPOSITORY) private readonly roles: IRolRepository) {}

  async execute(nombre: string): Promise<Rol | null> {
    return this.roles.findByNombre(normalizarTextoObligatorio(nombre, 'ROL'));
  }
}
