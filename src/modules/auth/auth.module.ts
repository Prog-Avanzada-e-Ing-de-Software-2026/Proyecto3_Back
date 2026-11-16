import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CreatePermisoUseCase } from './application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from './application/use-cases/create-rol.use-case.js';
import { FindPermisoByNombreUseCase } from './application/use-cases/find-permiso-by-nombre.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import {
  PASSWORD_HASHER,
  PERMISO_REPOSITORY,
  ROL_REPOSITORY,
  USUARIO_REPOSITORY,
} from './auth.repository-tokens.js';
import { Permiso } from './domain/entities/permiso.entity.js';
import { Rol } from './domain/entities/rol.entity.js';
import { Usuario } from './domain/entities/usuario.entity.js';
import { leerSecretoJwt } from './infrastructure/config/jwt-config.js';
import { MikroOrmPermisoRepository } from './infrastructure/repositories/mikro-orm-permiso.repository.js';
import { MikroOrmRolRepository } from './infrastructure/repositories/mikro-orm-rol.repository.js';
import { MikroOrmUsuarioRepository } from './infrastructure/repositories/mikro-orm-usuario.repository.js';
import { Argon2PasswordHasher } from './infrastructure/services/argon2-password-hasher.js';
import { AuthController } from './presentation/auth.controller.js';
import { AuthGuard } from './presentation/auth.guard.js';
import { SesionService } from './presentation/sesion.service.js';

/**
 * Composition root del módulo de identidad, autenticación y autorización.
 *
 * El guard se registra acá como `APP_GUARD` y aplica a toda la aplicación: el
 * default es cerrado y cada módulo abre lo que necesita con `@Public()`.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([Usuario, Rol, Permiso]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: leerSecretoJwt(),
        signOptions: { algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    CreatePermisoUseCase,
    CreateRolUseCase,
    FindPermisoByNombreUseCase,
    LoginUseCase,
    SesionService,
    { provide: PERMISO_REPOSITORY, useClass: MikroOrmPermisoRepository },
    { provide: ROL_REPOSITORY, useClass: MikroOrmRolRepository },
    { provide: USUARIO_REPOSITORY, useClass: MikroOrmUsuarioRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
