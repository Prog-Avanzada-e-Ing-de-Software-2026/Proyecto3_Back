import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermisoDto {
  @ApiProperty({
    example: 'material:crear',
    description: 'Nombre único del permiso',
  })
  @IsString({ message: 'El nombre del permiso debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre del permiso es obligatorio.' })
  nombre!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Descripción del permiso',
  })
  @IsOptional()
  @IsString({ message: 'La descripción del permiso debe ser un texto.' })
  descripcion?: string | null;
}
