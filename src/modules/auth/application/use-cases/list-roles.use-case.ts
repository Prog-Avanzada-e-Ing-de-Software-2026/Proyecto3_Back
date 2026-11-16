import { Inject, Injectable } from '@nestjs/common';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';

/** Proyección de un rol para las lecturas del catálogo. */
export interface RolResumen {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
}

/** Proyecta el agregado a un resumen plano, sin su colección de entidades. */
export function rolResumenDe(rol: Rol): RolResumen {
  return {
    id: rol.id,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    permisos: rol.permisos.getItems().map((permiso) => permiso.nombre),
  };
}

/** Listado de roles vigentes del catálogo. */
@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROL_REPOSITORY) private readonly roles: IRolRepository) {}

  async execute(): Promise<RolResumen[]> {
    const roles = await this.roles.findAll();

    return roles.map(rolResumenDe);
  }
}
