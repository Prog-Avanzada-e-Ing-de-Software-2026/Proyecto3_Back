import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { toRolResumen } from '../mappers/rol.mapper.js';
import type { RolResumen } from './rol-resumen.result.js';

/** Detalle de un rol vigente del catálogo. */
@Injectable()
export class FindRolByIdUseCase {
  constructor(@Inject(ROL_REPOSITORY) private readonly roles: IRolRepository) {}

  async execute(id: number): Promise<RolResumen> {
    const rol = await this.roles.findById(id);

    if (rol === null) {
      throw new ErrorSemantico('no_encontrado', 'ROL_NO_ENCONTRADO', 'El rol no existe.');
    }

    return toRolResumen(rol);
  }
}
