import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReplaceRolPermisosDto {
  @ApiProperty({
    type: [String],
    example: ['Crear plan', 'Gestionar alumnos'],
    description: 'Conjunto completo de permisos que queda en el rol',
  })
  @IsArray({ message: 'Los permisos deben ser una lista.' })
  @IsString({ each: true, message: 'Cada permiso debe ser un texto.' })
  permisos!: string[];
}
