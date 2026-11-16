import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorSemantico } from '../../../common/domain/errors/error-semantico.js';
import { CLAVE_RUTA_PUBLICA } from '../../../common/presentation/auth/public.decorator.js';
import type { SolicitudAutenticada } from '../../../common/presentation/auth/solicitud-autenticada.js';
import { USUARIO_REPOSITORY } from '../auth.repository-tokens.js';
import type { IUsuarioRepository } from '../domain/interfaces/usuario.repository.interface.js';
import { COOKIE_SESION } from './sesion.service.js';

interface ContenidoSesion {
  sub: number;
}

/**
 * Guard global de autenticación.
 *
 * Se registra como `APP_GUARD` en `AuthModule`, así que toda ruta nace cerrada
 * salvo que declare `@Public()`. Verifica la firma y la expiración del token y
 * después **lee el usuario de la base**: `RN-34` exige que la baja corte el
 * acceso sin esperar a que la sesión expire, y el rol y sus permisos son parte
 * de la autorización, no del token.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
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
    const usuarioId = await this.resolverActor(solicitud);

    solicitud.actorId = usuarioId;

    return true;
  }

  private async resolverActor(solicitud: SolicitudAutenticada): Promise<number> {
    const token: unknown = solicitud.cookies?.[COOKIE_SESION];

    if (typeof token !== 'string' || token.length === 0) {
      throw this.rechazarSesion();
    }

    let contenido: ContenidoSesion;

    try {
      contenido = await this.jwt.verifyAsync<ContenidoSesion>(token, { algorithms: ['HS256'] });
    } catch {
      // Firma alterada, algoritmo distinto o token vencido: las tres son la
      // misma condición desde el cliente y no se distinguen en la respuesta.
      throw this.rechazarSesion();
    }

    if (typeof contenido.sub !== 'number') {
      throw this.rechazarSesion();
    }

    const usuario = await this.usuarios.findById(contenido.sub);

    if (usuario === null || !usuario.estaActivo() || !usuario.rol.estaActivo()) {
      throw this.rechazarSesion();
    }

    return usuario.id;
  }

  private rechazarSesion(): ErrorSemantico {
    return new ErrorSemantico(
      'no_autenticado',
      'SESION_INVALIDA',
      'La operación requiere una sesión válida.',
    );
  }
}
