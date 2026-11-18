import { Inject, Injectable } from '@nestjs/common';
import { USUARIO_REPOSITORY } from '../../auth.repository-tokens.js';
import type { Usuario } from '../../domain/entities/usuario.entity.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';

/**
 * Lectura de un `Usuario` por identificador.
 *
 * Es el camino para que otro agregado resuelva a la persona sin inyectar el
 * puerto de `Usuario`: cada agregado solo conoce el repositorio propio.
 */
@Injectable()
export class FindUsuarioByIdUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository) {}

  async execute(id: number): Promise<Usuario | null> {
    return this.usuarios.findById(id);
  }
}
