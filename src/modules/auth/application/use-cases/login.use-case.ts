import { Inject, Injectable } from '@nestjs/common';
import { normalizarEmail } from '../../../../common/domain/validaciones.js';
import { PASSWORD_HASHER, USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import { CredencialesInvalidasError } from '../../domain/errors/credenciales-invalidas.error.js';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';
import { toSesionOtorgada } from '../mappers/sesion-otorgada.mapper.js';
import type { SesionOtorgada } from './sesion-otorgada.result.js';

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Inicio de sesión con email y contraseña.
 *
 * Devuelve el rol y los permisos efectivos, que es lo que el cliente necesita
 * para mostrar solo las funciones del usuario. El port excluye a los usuarios
 * dados de baja, así que la baja ya no llega hasta acá.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<SesionOtorgada> {
    const usuario = await this.usuarios.findByEmail(normalizarEmail(input.email));

    if (usuario === null || !usuario.rol.estaActivo()) {
      throw new CredencialesInvalidasError();
    }

    const verificada = await this.hasher.verify(usuario.passwordHash, input.password);

    if (!verificada) {
      throw new CredencialesInvalidasError();
    }

    return toSesionOtorgada(usuario);
  }
}
