import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Parámetros de paginación de una consulta.
 *
 * `skip` es la cantidad de elementos a omitir y `take` el tamaño de la página.
 * Los valores por defecto viven acá —y no en cada caso de uso— para que todas las
 * lecturas paginen igual; el máximo evita que un `take` enorme sea una negación
 * de servicio. Un valor fuera de rango se rechaza con `400` en lugar de
 * recortarse en silencio.
 */
export class PaginacionQueryDto {
  @ApiPropertyOptional({ minimum: 0, default: 0, description: 'Elementos a omitir' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El desplazamiento debe ser un número entero mayor o igual a 0.' })
  @Min(0, { message: 'El desplazamiento debe ser un número entero mayor o igual a 0.' })
  skip?: number = 0;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Cantidad de elementos de la página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad a traer debe ser un número entero entre 1 y 100.' })
  @Min(1, { message: 'La cantidad a traer debe ser un número entero entre 1 y 100.' })
  @Max(100, { message: 'La cantidad a traer debe ser un número entero entre 1 y 100.' })
  take?: number = 10;
}
