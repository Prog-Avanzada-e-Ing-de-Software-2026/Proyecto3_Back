import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CreatePermisoUseCase } from './application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from './application/use-cases/create-rol.use-case.js';
import { FindPermisoByIdUseCase } from './application/use-cases/find-permiso-by-id.use-case.js';
import { FindPermisoByNombreUseCase } from './application/use-cases/find-permiso-by-nombre.use-case.js';
import { FindRolByIdUseCase } from './application/use-cases/find-rol-by-id.use-case.js';
import { ListPermisosUseCase } from './application/use-cases/list-permisos.use-case.js';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { ReadSesionUseCase } from './application/use-cases/read-sesion.use-case.js';
import { ReplaceRolPermisosUseCase } from './application/use-cases/replace-rol-permisos.use-case.js';
import { UpdatePermisoUseCase } from './application/use-cases/update-permiso.use-case.js';
import { UpdateRolUseCase } from './application/use-cases/update-rol.use-case.js';
import {
  PASSWORD_HASHER,
  PERMISO_REPOSITORY,
  ROL_REPOSITORY,
  USUARIO_REPOSITORY,
} from './auth.repository-tokens.js';
import { Permiso } from './domain/entities/permiso.entity.js';
import { Rol } from './domain/entities/rol.entity.js';
import { Usuario } from './domain/entities/usuario.entity.js';
import {
  ALGORITMO_FIRMA,
  CONFIGURACION_SESION,
  leerConfiguracionSesion,
} from './infrastructure/config/jwt-config.js';
import { MikroOrmPermisoRepository } from './infrastructure/repositories/mikro-orm-permiso.repository.js';
import { MikroOrmRolRepository } from './infrastructure/repositories/mikro-orm-rol.repository.js';
import { MikroOrmUsuarioRepository } from './infrastructure/repositories/mikro-orm-usuario.repository.js';
import { Argon2PasswordHasher } from './infrastructure/services/argon2-password-hasher.js';
import { AuthController } from './presentation/auth.controller.js';
import { PermisosController } from './presentation/permisos.controller.js';
import { RolesController } from './presentation/roles.controller.js';
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
    // Sin secreto global: `SesionService` pasa el secreto del tipo en cada
    // firma y en cada verificación.
    JwtModule.register({ signOptions: { algorithm: ALGORITMO_FIRMA } }),
  ],
  controllers: [AuthController, RolesController, PermisosController],
  providers: [
    CreatePermisoUseCase,
    CreateRolUseCase,
    FindPermisoByIdUseCase,
    FindPermisoByNombreUseCase,
    FindRolByIdUseCase,
    ListPermisosUseCase,
    ListRolesUseCase,
    LoginUseCase,
    ReadSesionUseCase,
    ReplaceRolPermisosUseCase,
    UpdatePermisoUseCase,
    UpdateRolUseCase,
    { provide: CONFIGURACION_SESION, useFactory: () => leerConfiguracionSesion() },
    SesionService,
    { provide: PERMISO_REPOSITORY, useClass: MikroOrmPermisoRepository },
    { provide: ROL_REPOSITORY, useClass: MikroOrmRolRepository },
    { provide: USUARIO_REPOSITORY, useClass: MikroOrmUsuarioRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
