import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { ROL_REPOSITORY, USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';
import { exigirPermisosOtorgables } from '../../domain/services/permisos-otorgables.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';
import { resolverPermisos } from './resolver-permisos.js';

export interface CreateRolInput {
  nombre: string;
  descripcion?: string | null;
  permisos?: string[];
  /** Ausente solo en procesos internos declarados, como la carga inicial. */
  actorId?: number | null;
}

/**
 * Alta de un rol del catálogo.
 *
 * Rechaza el nombre duplicado —incluido el de un rol dado de baja, porque el
 * nombre no se libera— y verifica que el actor pueda otorgar todos los permisos
 * que asigna.
 */
@Injectable()
export class CreateRolUseCase {
  constructor(
    @Inject(ROL_REPOSITORY) private readonly roles: IRolRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
    private readonly buscarPermiso: FindPermisoByNombreUseCase,
  ) {}

  async execute(input: CreateRolInput): Promise<Rol> {
    const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');

    if (await this.roles.existeNombre(nombre)) {
      throw new ErrorSemantico('conflicto', 'ROL_DUPLICADO', `El rol ${nombre} ya existe.`);
    }

    const permisos = await resolverPermisos(input.permisos ?? [], this.buscarPermiso);

    await this.exigirActorPuedeOtorgar(input.actorId ?? null, permisos);

    const rol = Rol.crear({
      nombre,
      descripcion: input.descripcion ?? null,
      permisos,
    });
    rol.createdAt = new Date();
    rol.createdById = input.actorId ?? null;

    await this.roles.save(rol);

    return rol;
  }

  private async exigirActorPuedeOtorgar(
    actorId: number | null,
    permisos: Parameters<typeof exigirPermisosOtorgables>[1],
  ): Promise<void> {
    if (actorId === null || permisos.length === 0) {
      return;
    }

    const actor = await this.usuarios.findById(actorId);

    if (actor === null) {
      throw new ErrorSemantico(
        'no_autenticado',
        'SESION_INVALIDA',
        'La operación requiere una sesión válida.',
      );
    }

    exigirPermisosOtorgables(actor, permisos);
  }
}
