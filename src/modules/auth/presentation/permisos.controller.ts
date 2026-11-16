import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorActual } from '../../../common/presentation/auth/actor-actual.decorator.js';
import { RequierePermiso } from '../../../common/presentation/auth/requiere-permiso.decorator.js';
import { CreatePermisoUseCase } from '../application/use-cases/create-permiso.use-case.js';
import { FindPermisoByIdUseCase } from '../application/use-cases/find-permiso-by-id.use-case.js';
import {
  ListPermisosUseCase,
  permisoResumenDe,
} from '../application/use-cases/list-permisos.use-case.js';
import type { PermisoResumen } from '../application/use-cases/list-permisos.use-case.js';
import { UpdatePermisoUseCase } from '../application/use-cases/update-permiso.use-case.js';
import { NOMBRES_PERMISO } from '../domain/catalogos.js';
import { CreatePermisoDto } from './dto/create-permiso.dto.js';
import { UpdatePermisoDto } from './dto/update-permiso.dto.js';

@ApiTags('permisos')
@Controller('permisos')
export class PermisosController {
  constructor(
    private readonly listar: ListPermisosUseCase,
    private readonly buscar: FindPermisoByIdUseCase,
    private readonly crear: CreatePermisoUseCase,
    private readonly actualizar: UpdatePermisoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los permisos vigentes del catálogo' })
  async listarPermisos(): Promise<PermisoResumen[]> {
    return this.listar.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Devuelve un permiso vigente' })
  async buscarPermiso(@Param('id', ParseIntPipe) id: number): Promise<PermisoResumen> {
    return this.buscar.execute(id);
  }

  @Post()
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_PERMISOS)
  @ApiOperation({ summary: 'Da de alta un permiso del catálogo' })
  async crearPermiso(
    @Body() dto: CreatePermisoDto,
    @ActorActual() actorId: number,
  ): Promise<PermisoResumen> {
    const permiso = await this.crear.execute({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      actorId,
    });

    return permisoResumenDe(permiso);
  }

  @Patch(':id')
  @RequierePermiso(NOMBRES_PERMISO.GESTIONAR_PERMISOS)
  @ApiOperation({ summary: 'Edita nombre y descripción de un permiso' })
  async editarPermiso(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermisoDto,
    @ActorActual() actorId: number,
  ): Promise<PermisoResumen> {
    const permiso = await this.actualizar.execute({ id, nombre: dto.nombre, descripcion: dto.descripcion, actorId });

    return permisoResumenDe(permiso);
  }
}
