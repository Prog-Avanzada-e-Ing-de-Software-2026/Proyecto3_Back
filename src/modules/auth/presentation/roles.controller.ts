import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorActual } from '../../../common/presentation/auth/actor-actual.decorator.js';
import { ApiSolicitudInvalida } from '../../../common/presentation/swagger/solicitud-invalida.decorator.js';
import { RequierePermiso } from '../../../common/presentation/auth/requiere-permiso.decorator.js';
import { CreateRolUseCase } from '../application/use-cases/create-rol.use-case.js';
import { FindRolByIdUseCase } from '../application/use-cases/find-rol-by-id.use-case.js';
import { ListRolesUseCase, rolResumenDe } from '../application/use-cases/list-roles.use-case.js';
import type { RolResumen } from '../application/use-cases/list-roles.use-case.js';
import { ReplaceRolPermisosUseCase } from '../application/use-cases/replace-rol-permisos.use-case.js';
import { UpdateRolUseCase } from '../application/use-cases/update-rol.use-case.js';
import { NOMBRES_PERMISO } from '../domain/catalogos.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { ReplaceRolPermisosDto } from './dto/replace-rol-permisos.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly listar: ListRolesUseCase,
    private readonly buscar: FindRolByIdUseCase,
    private readonly crear: CreateRolUseCase,
    private readonly actualizar: UpdateRolUseCase,
    private readonly reemplazarPermisos: ReplaceRolPermisosUseCase,
  ) {}

  @Get()
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_ROLES)
  @ApiOperation({ summary: 'Lista los roles vigentes con sus permisos' })
  async listarRoles(): Promise<RolResumen[]> {
    return this.listar.execute();
  }

  @Get(':id')
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_ROLES)
  @ApiOperation({ summary: 'Devuelve un rol vigente con sus permisos' })
  async buscarRol(@Param('id', ParseIntPipe) id: number): Promise<RolResumen> {
    return this.buscar.execute(id);
  }

  @Post()
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_ROLES)
  @ApiOperation({ summary: 'Da de alta un rol del catálogo' })
  @ApiSolicitudInvalida()
  async crearRol(
    @Body() dto: CreateRolDto,
    @ActorActual() actorId: number,
  ): Promise<RolResumen> {
    const rol = await this.crear.execute({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      permisos: dto.permisos,
      actorId,
    });

    return rolResumenDe(rol);
  }

  @Patch(':id')
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_ROLES)
  @ApiOperation({ summary: 'Edita nombre y descripción de un rol' })
  @ApiSolicitudInvalida()
  async editarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolDto,
    @ActorActual() actorId: number,
  ): Promise<RolResumen> {
    const rol = await this.actualizar.execute({ id, nombre: dto.nombre, descripcion: dto.descripcion, actorId });

    return rolResumenDe(rol);
  }

  @Put(':id/permisos')
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_ROLES)
  @ApiOperation({ summary: 'Reemplaza el conjunto de permisos de un rol' })
  @ApiSolicitudInvalida()
  async reemplazarLosPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceRolPermisosDto,
    @ActorActual() actorId: number,
  ): Promise<RolResumen> {
    const rol = await this.reemplazarPermisos.execute({ id, permisos: dto.permisos, actorId });

    return rolResumenDe(rol);
  }
}
