import { ApiProperty } from '@nestjs/swagger';

/** Forma documentada de un permiso del catálogo. */
export class PermisoResumenDto {
  @ApiProperty({ example: 1, description: 'Identificador del permiso' })
  id!: number;

  @ApiProperty({ example: 'rol:consultar', description: 'Nombre del permiso' })
  nombre!: string;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Descripción del permiso',
  })
  descripcion!: string | null;
}
