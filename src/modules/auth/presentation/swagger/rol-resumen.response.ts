import { ApiProperty } from '@nestjs/swagger';

/** Forma documentada de un rol del catálogo. */
export class RolResumenDto {
  @ApiProperty({ example: 1, description: 'Identificador del rol' })
  id!: number;

  @ApiProperty({ example: 'Profesor', description: 'Nombre del rol' })
  nombre!: string;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Descripción del rol',
  })
  descripcion!: string | null;

  @ApiProperty({
    example: ['plan:crear'],
    description: 'Nombres de los permisos asignados',
    type: [String],
  })
  permisos!: string[];
}
