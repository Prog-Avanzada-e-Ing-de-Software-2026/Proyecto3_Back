import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { SesionInvalidaError } from '../domain/errors/sesion-invalida.error.js';
import {
  ALGORITMO_FIRMA,
  DURACION_POR_TIPO,
} from '../infrastructure/config/jwt-config.js';
import type { TipoToken } from '../infrastructure/config/jwt-config.js';

export const COOKIE_ACCESS = 'access';
export const COOKIE_REFRESH = 'refresh';

interface ContenidoSesion {
  sub: number;
  tipo: TipoToken;
}

/**
 * Emite y verifica las dos cookies de sesión.
 *
 * El `access` dura un cuarto de hora y viaja en todas las rutas; el `refresh`
 * dura una semana y solo se envía a `/api/auth`. Las dos son legibles por
 * JavaScript por decisión del usuario: el front las borra al cerrar sesión y
 * usa el refresh contra `/refresh`. El costo aceptado es que un XSS puede
 * leerlas.
 */
@Injectable()
export class SesionService {
  constructor(private readonly jwt: JwtService) {}

  async establecer(respuesta: Response, usuarioId: number): Promise<void> {
    respuesta.cookie(COOKIE_ACCESS, await this.firmar(usuarioId, 'access'), this.opciones('access'));
    respuesta.cookie(
      COOKIE_REFRESH,
      await this.firmar(usuarioId, 'refresh'),
      this.opciones('refresh'),
    );
  }

  async renovarAcceso(respuesta: Response, usuarioId: number): Promise<void> {
    respuesta.cookie(COOKIE_ACCESS, await this.firmar(usuarioId, 'access'), this.opciones('access'));
  }

  /**
   * Verifica firma, vencimiento y tipo, y devuelve el identificador del usuario.
   *
   * El tipo se compara porque los dos tokens comparten secreto y algoritmo: sin
   * esa comprobación un access serviría como refresh y la sesión de un cuarto de
   * hora se volvería eterna.
   */
  async verificar(token: unknown, esperado: TipoToken): Promise<number> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new SesionInvalidaError();
    }

    let contenido: ContenidoSesion;

    try {
      contenido = await this.jwt.verifyAsync<ContenidoSesion>(token, {
        algorithms: [ALGORITMO_FIRMA],
      });
    } catch {
      throw new SesionInvalidaError();
    }

    if (contenido.tipo !== esperado || typeof contenido.sub !== 'number') {
      throw new SesionInvalidaError();
    }

    return contenido.sub;
  }

  private async firmar(usuarioId: number, tipo: TipoToken): Promise<string> {
    return this.jwt.signAsync(
      { sub: usuarioId, tipo },
      { expiresIn: DURACION_POR_TIPO[tipo] },
    );
  }

  private opciones(tipo: TipoToken): CookieOptions {
    return {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: tipo === 'refresh' ? '/api/auth' : '/',
      maxAge: DURACION_POR_TIPO[tipo] * 1000,
    };
  }
}
