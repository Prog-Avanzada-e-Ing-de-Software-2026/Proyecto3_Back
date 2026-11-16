import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLAVE_RUTA_PUBLICA } from '../../../common/presentation/auth/public.decorator.js';
import type { SolicitudAutenticada } from '../../../common/presentation/auth/solicitud-autenticada.js';
import { USUARIO_REPOSITORY } from '../auth.repository-tokens.js';
import { SesionInvalidaError } from '../domain/errors/sesion-invalida.error.js';
import type { IUsuarioRepository } from '../domain/interfaces/usuario.repository.interface.js';
import { COOKIE_ACCESS, SesionService } from './sesion.service.js';

/**
 * Guard global de autenticación.
 *
 * Se registra como `APP_GUARD` en `AuthModule`, así que toda ruta nace cerrada
 * salvo que declare `@Public()`. Verifica la cookie de access y después **lee el
 * usuario de la base**: `RN-34` exige que la baja corte el acceso sin esperar a
 * que el token expire, y el rol y sus permisos son parte de la autorización, no
 * del token.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sesion: SesionService,
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: IUsuarioRepository,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(CLAVE_RUTA_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (publica === true) {
      return true;
    }

    const solicitud = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
    const usuarioId = await this.sesion.verificar(solicitud.cookies?.[COOKIE_ACCESS], 'access');
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.estaActivo() || !usuario.rol.estaActivo()) {
      throw new SesionInvalidaError();
    }

    solicitud.actorId = usuario.id;

    return true;
  }
}
