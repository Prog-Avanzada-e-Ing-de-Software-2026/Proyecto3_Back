import { Inject, Injectable } from '@nestjs/common';
import { PERMISO_REPOSITORY } from '../../auth.repository-tokens.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';

/** Proyección de un permiso para las lecturas del catálogo. */
export interface PermisoResumen {
  id: number;
  nombre: string;
  descripcion: string | null;
}

/** Proyecta el agregado a un resumen plano. */
export function permisoResumenDe(permiso: Permiso): PermisoResumen {
  return {
    id: permiso.id,
    nombre: permiso.nombre,
    descripcion: permiso.descripcion,
  };
}

/** Listado de permisos vigentes del catálogo. */
@Injectable()
export class ListPermisosUseCase {
  constructor(@Inject(PERMISO_REPOSITORY) private readonly permisos: IPermisoRepository) {}

  async execute(): Promise<PermisoResumen[]> {
    const permisos = await this.permisos.findAll();

    return permisos.map(permisoResumenDe);
  }
}
