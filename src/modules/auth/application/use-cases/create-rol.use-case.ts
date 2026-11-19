import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { ROL_REPOSITORY } from '../../auth.repository-tokens.js';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import type { CreateRolDto } from '../../presentation/dto/create-rol.dto.js';
import { resolverPermisos } from '../services/resolver-permisos.js';
import { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

/**
 * Alta de un rol del catálogo.
 *
 * El nombre no se libera con la baja, así que la unicidad también mira los roles
 * dados de baja.
 */
@Injectable()
export class CreateRolUseCase {
  constructor(
    @Inject(ROL_REPOSITORY) private readonly roles: IRolRepository,
    private readonly buscarPermiso: FindPermisoByNombreUseCase,
  ) {}

  async execute(dto: CreateRolDto, actorId?: number | null): Promise<Rol> {
    const nombre = normalizarTextoObligatorio(dto.nombre, 'NOMBRE');

    if (await this.roles.existeNombre(nombre)) {
      throw new ErrorSemantico('conflicto', 'ROL_DUPLICADO', `El rol ${nombre} ya existe.`);
    }

    const permisos = await resolverPermisos(dto.permisos ?? [], this.buscarPermiso);

    const rol = Rol.crear({ nombre, descripcion: dto.descripcion ?? null, permisos });
    rol.createdAt = new Date();
    rol.createdById = actorId ?? null;

    await this.roles.save(rol);

    return rol;
  }
}
