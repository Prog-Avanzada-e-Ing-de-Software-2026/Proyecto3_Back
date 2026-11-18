import { Inject, Injectable } from '@nestjs/common';
import { USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import { SesionInvalidaError } from '../../domain/errors/sesion-invalida.error.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';
import { toSesionOtorgada } from '../mappers/sesion-otorgada.mapper.js';
import type { SesionOtorgada } from './sesion-otorgada.result.js';

/**
 * Lee la sesión vigente de un usuario identificado.
 *
 * Vuelve a leer el usuario en lugar de confiar en el token: si lo dieron de baja,
 * un refresh de una semana sería la forma de sobrevivir a esa baja.
 */
@Injectable()
export class ReadSesionUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository) {}

  async execute(usuarioId: number): Promise<SesionOtorgada> {
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.rol.estaActivo()) {
      throw new SesionInvalidaError();
    }

    return toSesionOtorgada(usuario);
  }
}
