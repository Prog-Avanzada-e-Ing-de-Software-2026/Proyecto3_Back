import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { exigirActorPuedeOtorgar } from '../services/exigir-actor-puede-otorgar.js';
import { resolverPermisos } from '../services/resolver-permisos.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';
import { FindUsuarioByIdUseCase } from './find-usuario-by-id.use-case.js';

export interface ReplaceRolPermisosInput {
  id: number;
  permisos: string[];
  actorId?: number | null;
}

/**
 * Reemplaza el conjunto de permisos de un rol.
 *
 * El conjunto pedido se valida completo antes de tocar el agregado: un permiso
 * inexistente, repetido o que el actor no tenga deja al rol como estaba.
 */
@Injectable()
export class ReplaceRolPermisosUseCase {
  constructor(
    @Inject(ROL_REPOSITORY) private readonly roles: IRolRepository,
    private readonly buscarActor: FindUsuarioByIdUseCase,
    private readonly buscarPermiso: FindPermisoByNombreUseCase,
  ) {}

  async execute(input: ReplaceRolPermisosInput): Promise<Rol> {
    const rol = await this.roles.findById(input.id);

    if (rol === null) {
      throw new ErrorSemantico('no_encontrado', 'ROL_NO_ENCONTRADO', 'El rol no existe.');
    }

    const solicitados = await resolverPermisos(input.permisos, this.buscarPermiso);
    await exigirActorPuedeOtorgar(input.actorId, solicitados, this.buscarActor);

    this.aplicarConjunto(rol, solicitados);
    rol.updatedAt = new Date();
    rol.updatedById = input.actorId ?? null;

    await this.roles.save(rol);

    return rol;
  }

  private aplicarConjunto(rol: Rol, solicitados: Permiso[]): void {
    const deseados = new Set(solicitados.map((permiso) => permiso.nombre));

    for (const permiso of rol.permisos.getItems()) {
      if (!deseados.has(permiso.nombre)) {
        rol.quitarPermiso(permiso);
      }
    }

    for (const permiso of solicitados) {
      if (!rol.permisos.contains(permiso)) {
        rol.asignarPermiso(permiso);
      }
    }
  }
}
