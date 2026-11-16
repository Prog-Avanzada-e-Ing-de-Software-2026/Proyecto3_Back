import { Inject, Injectable } from '@nestjs/common';
import { USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import { SesionInvalidaError } from '../../domain/errors/sesion-invalida.error.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';
import { sesionOtorgadaDe } from './sesion-otorgada.result.js';
import type { SesionOtorgada } from './sesion-otorgada.result.js';

/**
 * Lee la sesión vigente de un usuario identificado.
 *
 * Lo usan la renovación —cuyo controller además emite la cookie de access— y la
 * consulta de la identidad propia. Vuelve a leer el usuario en lugar de confiar
 * en el token: `RN-34` exige que la baja corte el acceso, y un refresh de una
 * semana sería justamente la forma de sobrevivir a esa baja.
 */
@Injectable()
export class ReadSesionUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository) {}

  async execute(usuarioId: number): Promise<SesionOtorgada> {
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.estaActivo() || !usuario.rol.estaActivo()) {
      throw new SesionInvalidaError();
    }

    return sesionOtorgadaDe(usuario);
  }
}
