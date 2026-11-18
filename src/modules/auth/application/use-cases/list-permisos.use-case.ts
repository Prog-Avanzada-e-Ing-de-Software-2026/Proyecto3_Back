import { Inject, Injectable } from '@nestjs/common';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';
import { toPermisoResumen } from '../mappers/permiso.mapper.js';
import type { PermisoResumen } from './permiso-resumen.result.js';

/** Listado de permisos vigentes del catálogo. */
@Injectable()
export class ListPermisosUseCase {
  constructor(@Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository) {}

  async execute(): Promise<PermisoResumen[]> {
    const permisos = await this.permisos.findAll();

    return permisos.map(toPermisoResumen);
  }
}
