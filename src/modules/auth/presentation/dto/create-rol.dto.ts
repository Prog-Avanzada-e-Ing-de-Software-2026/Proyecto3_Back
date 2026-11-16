import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'Entrenador', description: 'Nombre único del rol' })
  @IsString({ message: 'El nombre del rol debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio.' })
  nombre!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Descripción del rol' })
  @IsOptional()
  @IsString({ message: 'La descripción del rol debe ser un texto.' })
  descripcion?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['Crear plan'],
    description: 'Nombres de permisos a asignar',
  })
  @IsOptional()
  @IsArray({ message: 'Los permisos deben ser una lista.' })
  @IsString({ each: true, message: 'Cada permiso debe ser un texto.' })
  permisos?: string[];
}
