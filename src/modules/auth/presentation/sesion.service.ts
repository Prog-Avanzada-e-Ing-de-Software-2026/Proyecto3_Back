import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { DURACION_SESION_SEGUNDOS } from '../infrastructure/config/jwt-config.js';

export const COOKIE_SESION = 'sesion';

/**
 * Emite y expira la cookie de sesión.
 *
 * El token nunca viaja en el cuerpo: `httpOnly` lo deja fuera del alcance del
 * JavaScript del cliente, y `SameSite=Lax` bloquea el envío en peticiones
 * cross-site no navegacionales.
 */
@Injectable()
export class SesionService {
  constructor(private readonly jwt: JwtService) {}

  async establecer(respuesta: Response, usuarioId: number): Promise<void> {
    const token = await this.jwt.signAsync({ sub: usuarioId });

    respuesta.cookie(COOKIE_SESION, token, {
      ...this.opciones(),
      maxAge: DURACION_SESION_SEGUNDOS * 1000,
    });
  }

  private opciones(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
  }
}
