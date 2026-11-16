import { Inject, Injectable } from '@nestjs/common';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import {
  normalizarEmail,
  normalizarTextoObligatorio,
} from '../../../../common/domain/validaciones.js';
import {
  PASSWORD_HASHER,
  ROL_REPOSITORY,
  USUARIO_REPOSITORY,
} from '../../auth.repository-tokens.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';

const LONGITUD_MINIMA_CREDENCIAL = 8;

export interface CreateUsuarioInput {
  email: string;
  password: string;
  rolNombre: string;
  /** Ausente solo en procesos internos declarados, como la carga inicial. */
  actorId?: number | null;
}

/**
 * Alta de un `Usuario` con su rol.
 *
 * Es el camino que van a reusar las altas de alumno y profesor para crear la
 * identidad de la persona: valida la unicidad del email —incluido el de un
 * usuario dado de baja—, exige un rol vigente y hashea la credencial.
 */
@Injectable()
export class CreateUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
    @Inject(ROL_REPOSITORY) private readonly roles: IRolRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: CreateUsuarioInput): Promise<Usuario> {
    const email = normalizarEmail(input.email);

    if (input.password.length < LONGITUD_MINIMA_CREDENCIAL) {
      throw new ErrorSemantico(
        'entrada_invalida',
        'CREDENCIAL_DEBIL',
        `La contraseña debe tener al menos ${LONGITUD_MINIMA_CREDENCIAL} caracteres.`,
      );
    }

    if ((await this.usuarios.findByEmail(email)) !== null) {
      throw new ErrorSemantico(
        'conflicto',
        'USUARIO_DUPLICADO',
        'El email ya pertenece a otro usuario.',
      );
    }

    const rol = await this.roles.findByNombre(
      normalizarTextoObligatorio(input.rolNombre, 'ROL'),
    );

    if (rol === null || !rol.estaActivo()) {
      throw new ErrorSemantico(
        'no_encontrado',
        'ROL_NO_ENCONTRADO',
        `El rol ${input.rolNombre} no existe o está dado de baja.`,
      );
    }

    const usuario = Usuario.crear({
      email,
      passwordHash: await this.hasher.hash(input.password),
      rol,
    });
    usuario.createdAt = new Date();
    usuario.createdById = input.actorId ?? null;

    await this.usuarios.save(usuario);

    return usuario;
  }
}
