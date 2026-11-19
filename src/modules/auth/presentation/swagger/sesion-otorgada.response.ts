import { ApiProperty } from '@nestjs/swagger';

/**
 * Forma documentada de la sesión concedida.
 *
 * Espeja la proyección de aplicación `SesionOtorgada`: Swagger necesita una
 * clase con metadatos en runtime, y el contrato del transporte vive en
 * `presentation/`.
 */
export class SesionOtorgadaDto {
  @ApiProperty({ example: 7, description: 'Identificador del usuario' })
  id!: number;

  @ApiProperty({ example: 'alumno@gym.com', description: 'Email del usuario' })
  email!: string;

  @ApiProperty({ example: 'Alumno', description: 'Nombre del rol' })
  rol!: string;

  @ApiProperty({
    example: ['plan:crear'],
    description: 'Permisos efectivos del rol, con la forma `recurso:acción`',
    type: [String],
  })
  permisos!: string[];
}
