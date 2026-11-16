import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { ROL_REPOSITORY, USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';
import { exigirPermisosOtorgables } from '../../domain/services/permisos-otorgables.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';
import { resolverPermisos } from './resolver-permisos.js';

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
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
    private readonly buscarPermiso: FindPermisoByNombreUseCase,
  ) {}

  async execute(input: ReplaceRolPermisosInput): Promise<Rol> {
    const rol = await this.roles.findById(input.id);

    if (rol === null) {
      throw new ErrorSemantico('no_encontrado', 'ROL_NO_ENCONTRADO', 'El rol no existe.');
    }

    const solicitados = await resolverPermisos(input.permisos, this.buscarPermiso);

    if (input.actorId !== null && input.actorId !== undefined) {
      const actor = await this.usuarios.findById(input.actorId);

      if (actor === null) {
        throw new ErrorSemantico(
          'no_autenticado',
          'SESION_INVALIDA',
          'La operación requiere una sesión válida.',
        );
      }

      exigirPermisosOtorgables(actor, solicitados);
    }

    this.aplicarConjunto(rol, solicitados);
    rol.updatedAt = new Date();
    rol.updatedById = input.actorId ?? null;

    await this.roles.save(rol);

    return rol;
  }

  /**
   * Deja al rol con exactamente el conjunto pedido.
   *
   * `Rol` rechaza el permiso repetido al asignarlo, así que los repetidos del
   * pedido ya fallaron en `resolverPermisos` o acá.
   */
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
