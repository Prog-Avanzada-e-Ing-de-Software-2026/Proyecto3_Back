import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermisoDto {
  @ApiProperty({ example: 'Gestionar materiales', description: 'Nombre único del permiso' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Descripción del permiso' })
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}
