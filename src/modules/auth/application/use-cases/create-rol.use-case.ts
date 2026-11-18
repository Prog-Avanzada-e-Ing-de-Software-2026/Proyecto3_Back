import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { exigirActorPuedeOtorgar } from '../services/exigir-actor-puede-otorgar.js';
import { resolverPermisos } from '../services/resolver-permisos.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';
import { FindUsuarioByIdUseCase } from './find-usuario-by-id.use-case.js';

export interface CreateRolInput {
  nombre: string;
  descripcion?: string | null;
  permisos?: string[];
  actorId?: number | null;
}

/**
 * Alta de un rol del catálogo.
 *
 * El nombre no se libera con la baja, así que la unicidad también mira los roles
 * dados de baja. Cuando la operación asigna permisos, el actor solo puede
 * otorgar los que él tiene.
 */
@Injectable()
export class CreateRolUseCase {
  constructor(
    @Inject(ROL_REPOSITORY) private readonly roles: IRolRepository,
    private readonly buscarActor: FindUsuarioByIdUseCase,
    private readonly buscarPermiso: FindPermisoByNombreUseCase,
  ) {}

  async execute(input: CreateRolInput): Promise<Rol> {
    const nombre = normalizarTextoObligatorio(input.nombre, 'NOMBRE');

    if (await this.roles.existeNombre(nombre)) {
      throw new ErrorSemantico('conflicto', 'ROL_DUPLICADO', `El rol ${nombre} ya existe.`);
    }

    const permisos = await resolverPermisos(input.permisos ?? [], this.buscarPermiso);
    await exigirActorPuedeOtorgar(input.actorId, permisos, this.buscarActor);

    const rol = Rol.crear({ nombre, descripcion: input.descripcion ?? null, permisos });
    rol.createdAt = new Date();
    rol.createdById = input.actorId ?? null;

    await this.roles.save(rol);

    return rol;
  }
}
