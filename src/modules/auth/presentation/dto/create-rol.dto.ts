import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'Entrenador', description: 'Nombre único del rol' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Descripción del rol' })
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['Crear plan'],
    description: 'Nombres de permisos a asignar',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permisos?: string[];
}
