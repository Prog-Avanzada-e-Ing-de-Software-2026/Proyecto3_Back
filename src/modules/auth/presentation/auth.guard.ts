import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorSemantico } from '../../../common/domain/errors/error-semantico.js';
import { CLAVE_RUTA_PUBLICA } from '../../../common/presentation/auth/public.decorator.js';
import { CLAVE_PERMISO } from '../../../common/presentation/auth/requiere-permiso.decorator.js';
import type { SolicitudAutenticada } from '../../../common/presentation/auth/solicitud-autenticada.js';
import { FindUsuarioByIdUseCase } from '../application/use-cases/find-usuario-by-id.use-case.js';
import { SesionInvalidaError } from '../domain/errors/sesion-invalida.error.js';
import { COOKIE_ACCESS, SesionService } from './sesion.service.js';

/**
 * Guard global de sesión, identidad y autorización.
 *
 * Se registra como `APP_GUARD` en `AuthModule`, así que toda ruta nace cerrada
 * salvo que declare `@Public()`. En orden: verifica la cookie de access, carga al
 * usuario vigente con su rol y, si la operación declara `@RequierePermiso`,
 * comprueba que el permiso esté entre los efectivos.
 *
 * El orden importa: sin sesión la respuesta es `401` y solo un autenticado puede
 * recibir `403`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sesion: SesionService,
    private readonly buscarUsuario: FindUsuarioByIdUseCase,
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
    const usuario = await this.buscarUsuario.execute(usuarioId);

    if (usuario === null || !usuario.rol.estaActivo()) {
      throw new SesionInvalidaError();
    }

    solicitud.usuario = usuario;

    this.autorizar(contexto, usuario);

    return true;
  }

  private autorizar(
    contexto: ExecutionContext,
    usuario: NonNullable<SolicitudAutenticada['usuario']>,
  ): void {
    const requerido = this.reflector.getAllAndOverride<string>(CLAVE_PERMISO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (requerido === undefined) {
      return;
    }

    const efectivos = usuario.permisosEfectivos().map((permiso) => permiso.nombre);

    if (!efectivos.includes(requerido)) {
      throw new ErrorSemantico(
        'prohibido',
        'SIN_PERMISO',
        'La operación requiere un permiso que el usuario no tiene.',
      );
    }
  }
}
