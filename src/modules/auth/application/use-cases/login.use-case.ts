import { Inject, Injectable } from '@nestjs/common';
import { normalizarEmail } from '../../../../common/domain/validaciones.js';
import { PASSWORD_HASHER, USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import { CredencialesInvalidasError } from '../../domain/errors/credenciales-invalidas.error.js';
import type { IPasswordHasher } from '../../domain/interfaces/password-hasher.interface.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  id: number;
  email: string;
  rol: string;
  permisos: string[];
}

/**
 * Inicio de sesión con email y contraseña.
 *
 * Traduce las tres causas de rechazo a la misma excepción y devuelve el rol y
 * los permisos efectivos, que es lo que el cliente necesita para mostrar solo
 * las funciones del usuario (`HU 14`, `RN-32`, `RN-34`).
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const usuario = await this.usuarios.findByEmail(normalizarEmail(input.email));

    if (usuario === null || !usuario.estaActivo() || !usuario.rol.estaActivo()) {
      throw new CredencialesInvalidasError();
    }

    const verificada = await this.hasher.verify(usuario.passwordHash, input.password);

    if (!verificada) {
      throw new CredencialesInvalidasError();
    }

    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol.nombre,
      permisos: usuario.permisosEfectivos().map((permiso) => permiso.nombre),
    };
  }
}
