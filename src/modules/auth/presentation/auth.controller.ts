import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../common/presentation/auth/public.decorator.js';
import { LoginUseCase } from '../application/use-cases/login.use-case.js';
import type { LoginResult } from '../application/use-cases/login.use-case.js';
import { LoginDto } from './dto/login.dto.js';
import { SesionService } from './sesion.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly sesion: SesionService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión y deja la sesión en una cookie httpOnly' })
  @ApiOkResponse({
    description: 'Sesión concedida; devuelve el rol y los permisos efectivos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario dado de baja, sin distinguir la causa.',
  })
  async iniciarSesion(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<LoginResult> {
    const resultado = await this.login.execute({ email: dto.email, password: dto.password });

    await this.sesion.establecer(respuesta, resultado.id);

    return resultado;
  }
}
