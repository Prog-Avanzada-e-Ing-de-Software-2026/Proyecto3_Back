import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRolDto {
  @ApiPropertyOptional({ description: 'Nombre nuevo; no se admite en roles requeridos' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Descripción nueva' })
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}
