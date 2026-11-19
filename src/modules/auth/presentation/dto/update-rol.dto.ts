import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRolDto {
  @ApiPropertyOptional({
    description: 'Nombre nuevo; no se admite en roles requeridos',
  })
  @IsOptional()
  @IsString({ message: 'El nombre del rol debe ser un texto.' })
  nombre?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Descripción nueva' })
  @IsOptional()
  @IsString({ message: 'La descripción del rol debe ser un texto.' })
  descripcion?: string | null;
}
