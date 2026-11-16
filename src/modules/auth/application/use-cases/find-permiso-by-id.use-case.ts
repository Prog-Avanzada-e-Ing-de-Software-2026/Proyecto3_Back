import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { permisoResumenDe } from './list-permisos.use-case.js';
import type { PermisoResumen } from './list-permisos.use-case.js';

/** Detalle de un permiso vigente del catálogo. */
@Injectable()
export class FindPermisoByIdUseCase {
  constructor(@Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository) {}

  async execute(id: number): Promise<PermisoResumen> {
    const permiso = await this.permisos.findById(id);

    if (permiso === null) {
      throw new ErrorSemantico(
        'no_encontrado',
        'PERMISO_NO_ENCONTRADO',
        'El permiso no existe.',
      );
    }

    return permisoResumenDe(permiso);
  }
}
