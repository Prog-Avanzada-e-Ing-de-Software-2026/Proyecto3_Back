import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ActorActual } from '../../../common/presentation/auth/actor-actual.decorator.js';
import { Public } from '../../../common/presentation/auth/public.decorator.js';
import { ApiSolicitudInvalida } from '../../../common/presentation/swagger/solicitud-invalida.decorator.js';
import { LoginUseCase } from '../application/use-cases/login.use-case.js';
import { ReadSesionUseCase } from '../application/use-cases/read-sesion.use-case.js';
import type { SesionOtorgada } from '../application/use-cases/sesion-otorgada.result.js';
import { LoginDto } from './dto/login.dto.js';
import { SesionOtorgadaDto } from './swagger/sesion-otorgada.response.js';
import { COOKIE_REFRESH, SesionService } from './sesion.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly sesionActual: ReadSesionUseCase,
    private readonly sesion: SesionService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión y emite las cookies de access y refresh' })
  @ApiSolicitudInvalida()
  @ApiOkResponse({ type: SesionOtorgadaDto, description: 'Devuelve el rol y los permisos efectivos.' })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario dado de baja, sin distinguir la causa.',
  })
  async iniciarSesion(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<SesionOtorgada> {
    const resultado = await this.login.execute({ email: dto.email, password: dto.password });

    await this.sesion.establecer(respuesta, resultado.id);

    return resultado;
  }

  @Get('me')
  @ApiCookieAuth('access')
  @ApiOperation({ summary: 'Devuelve el usuario autenticado con su rol y sus permisos' })
  @ApiOkResponse({ type: SesionOtorgadaDto, description: 'Identidad, rol y permisos efectivos del usuario de la sesión.' })
  @ApiUnauthorizedResponse({ description: 'No hay una sesión válida' })
  async consultarIdentidad(@ActorActual() actorId: number): Promise<SesionOtorgada> {
    return this.sesionActual.execute(actorId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva la cookie de access a partir de la de refresh' })
  @ApiOkResponse({ type: SesionOtorgadaDto, description: 'Emite un access nuevo y devuelve rol y permisos.' })
  @ApiUnauthorizedResponse({ description: 'No hay un refresh válido' })
  async renovarSesion(
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<SesionOtorgada> {
    const usuarioId = await this.sesion.verificar(solicitud.cookies?.[COOKIE_REFRESH], 'refresh');
    const resultado = await this.sesionActual.execute(usuarioId);

    await this.sesion.renovarAcceso(respuesta, resultado.id);

    return resultado;
  }
}
