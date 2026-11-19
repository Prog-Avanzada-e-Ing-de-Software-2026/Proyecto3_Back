import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePermisoDto {
  @ApiPropertyOptional({
    description: 'Nombre nuevo; no se admite en permisos requeridos',
  })
  @IsOptional()
  @IsString({ message: 'El nombre del permiso debe ser un texto.' })
  nombre?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Descripción nueva' })
  @IsOptional()
  @IsString({ message: 'La descripción del permiso debe ser un texto.' })
  descripcion?: string | null;
}
