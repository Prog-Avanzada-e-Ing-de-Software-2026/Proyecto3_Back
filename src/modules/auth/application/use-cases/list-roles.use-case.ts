import { Inject, Injectable } from '@nestjs/common';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { toRolResumen } from '../mappers/rol.mapper.js';
import type { RolResumen } from './rol-resumen.result.js';

/** Listado de roles vigentes del catálogo. */
@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROL_REPOSITORY) private readonly roles: IRolRepository) {}

  async execute(): Promise<RolResumen[]> {
    const roles = await this.roles.findAll();

    return roles.map(toRolResumen);
  }
}
