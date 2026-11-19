import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarEmail } from '../../../../common/domain/validaciones.js';
import {
  PASSWORD_HASHER,
  USUARIO_REPOSITORY,
} from '../../auth.repository-tokens.js';
import { exigirCredencial } from '../../domain/credencial.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';
import type { CreateUsuarioDto } from '../../presentation/dto/create-usuario.dto.js';
import { FindRolByNombreUseCase } from './find-rol-by-nombre.use-case.js';

/**
 * Alta de un `Usuario` con su rol.
 *
 * Es el camino que van a reusar las altas de alumno y profesor para crear la
 * identidad de la persona. El email no se libera con la baja, así que la
 * unicidad también mira los usuarios dados de baja.
 */
@Injectable()
export class CreateUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
    private readonly buscarRol: FindRolByNombreUseCase,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(dto: CreateUsuarioDto, actorId?: number | null): Promise<Usuario> {
    const email = normalizarEmail(dto.email);
    exigirCredencial(dto.password);

    if ((await this.usuarios.findByEmailIncluyendoBaja(email)) !== null) {
      throw new ErrorSemantico(
        'conflicto',
        'USUARIO_DUPLICADO',
        'El email ya pertenece a otro usuario.',
      );
    }

    const rol = await this.buscarRol.execute(dto.rolNombre);

    if (rol === null || !rol.estaActivo()) {
      throw new ErrorSemantico(
        'no_encontrado',
        'ROL_NO_ENCONTRADO',
        `El rol ${dto.rolNombre} no existe o está dado de baja.`,
      );
    }

    const usuario = Usuario.crear({
      email,
      passwordHash: await this.hasher.hash(dto.password),
      rol,
    });
    usuario.createdAt = new Date();
    usuario.createdById = actorId ?? null;

    await this.usuarios.save(usuario);

    return usuario;
  }
}
