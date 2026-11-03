import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CreatePermisoUseCase } from './application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from './application/use-cases/create-rol.use-case.js';
import { PERMISO_REPOSITORY, ROL_REPOSITORY } from './auth.tokens.js';
import { Permiso } from './domain/entities/permiso.entity.js';
import { Rol } from './domain/entities/rol.entity.js';
import { Usuario } from './domain/entities/usuario.entity.js';
import { MikroOrmPermisoRepository } from './infrastructure/repositories/mikro-orm-permiso.repository.js';
import { MikroOrmRolRepository } from './infrastructure/repositories/mikro-orm-rol.repository.js';

/**
 * Composition root del módulo de identidad y autorización.
 *
 * Este cambio expone solo los casos de uso de la carga inicial; login y
 * autorización llegan con su propio cambio.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Usuario, Rol, Permiso])],
  providers: [
    CreatePermisoUseCase,
    CreateRolUseCase,
    { provide: PERMISO_REPOSITORY, useClass: MikroOrmPermisoRepository },
    { provide: ROL_REPOSITORY, useClass: MikroOrmRolRepository },
  ],
  exports: [CreatePermisoUseCase, CreateRolUseCase],
})
export class AuthModule {}
