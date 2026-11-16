import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../../common/presentation/auth/public.decorator.js';
import { LoginUseCase } from '../application/use-cases/login.use-case.js';
import { RefreshSesionUseCase } from '../application/use-cases/refresh-sesion.use-case.js';
import type { SesionOtorgada } from '../application/use-cases/sesion-otorgada.result.js';
import { LoginDto } from './dto/login.dto.js';
import { COOKIE_REFRESH, SesionService } from './sesion.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshSesionUseCase,
    private readonly sesion: SesionService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión y emite las cookies de access y refresh' })
  @ApiOkResponse({ description: 'Devuelve el rol y los permisos efectivos.' })
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

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva la cookie de access a partir de la de refresh' })
  @ApiOkResponse({ description: 'Emite un access nuevo y devuelve rol y permisos.' })
  @ApiUnauthorizedResponse({ description: 'No hay un refresh válido' })
  async renovarSesion(
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<SesionOtorgada> {
    const usuarioId = await this.sesion.verificar(solicitud.cookies?.[COOKIE_REFRESH], 'refresh');
    const resultado = await this.refresh.execute(usuarioId);

    await this.sesion.renovarAcceso(respuesta, resultado.id);

    return resultado;
  }
}
