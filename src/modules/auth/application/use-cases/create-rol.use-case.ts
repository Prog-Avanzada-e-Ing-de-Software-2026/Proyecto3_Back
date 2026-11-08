import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

export interface CreateRolInput {
  nombre: string;
  descripcion?: string | null;
  permisos: string[];
}

/**
 * Alta idempotente de un rol con sus permisos.
 *
 * Resuelve cada permiso antes de escribir: un código inexistente se rechaza sin
 * dejar el rol a medio construir.
 */
@Injectable()
export class CreateRolUseCase {
  constructor(
    @Inject(ROL_REPOSITORY) private readonly roles: IRolRepository,
    private readonly buscarPermiso: FindPermisoByNombreUseCase,
  ) {}

  async execute(input: CreateRolInput): Promise<Rol> {
    const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');
    const existente = await this.roles.findByNombre(nombre);

    if (existente !== null) {
      return existente;
    }

    const permisos = [];

    for (const nombrePermiso of input.permisos) {
      const permiso = await this.buscarPermiso.execute(nombrePermiso);

      if (permiso === null) {
        throw new ErrorSemantico(
          'no_encontrado',
          'PERMISO_NO_ENCONTRADO',
          `El permiso ${nombrePermiso} no existe.`,
        );
      }

      permisos.push(permiso);
    }

    const rol = Rol.crear({
      nombre,
      descripcion: input.descripcion ?? null,
      permisos,
    });
    rol.createdAt = new Date();

    await this.roles.save(rol);

    return rol;
  }
}
