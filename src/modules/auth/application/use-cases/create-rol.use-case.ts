import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarCodigo } from '../../../../common/domain/validaciones.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import type { CreateRolInput } from './create-rol.input.js';
import { FindPermisoByCodigoUseCase } from './find-permiso-by-codigo.use-case.js';

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
    private readonly buscarPermiso: FindPermisoByCodigoUseCase,
  ) {}

  async execute(input: CreateRolInput): Promise<Rol> {
    const codigo = normalizarCodigo(input.codigo);
    const existente = await this.roles.findByCodigo(codigo);

    if (existente !== null) {
      return existente;
    }

    const permisos = [];

    for (const codigoPermiso of input.permisos) {
      const permiso = await this.buscarPermiso.execute(codigoPermiso);

      if (permiso === null) {
        throw new ErrorSemantico(
          'no_encontrado',
          'PERMISO_NO_ENCONTRADO',
          `El permiso ${codigoPermiso} no existe.`,
        );
      }

      permisos.push(permiso);
    }

    const rol = Rol.crear({
      codigo,
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
      permisos,
      createdAt: new Date(),
      createdById: null,
    });

    await this.roles.save(rol);

    return rol;
  }
}
