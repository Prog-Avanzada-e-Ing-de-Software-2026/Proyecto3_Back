import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** Página por defecto de cualquier listado paginado. */
export const DEFAULT_PAGE = 1;

/** Cantidad de filas por página cuando el cliente no la indica. */
export const DEFAULT_LIMIT = 10;

/** Techo de filas por página que acepta la API. */
export const MAX_LIMIT = 100;

/**
 * Parámetros de paginación de una lectura, compartidos por todos los listados.
 *
 * Los valores llegan como texto del query string y el `ValidationPipe` global
 * los transforma y valida: la página arranca en 1 y el límite en 10, con un
 * techo de 100 filas. Un DTO de listado propio extiende esta clase y agrega sus
 * filtros.
 */
export class PaginationDto {
  @ApiPropertyOptional({
    default: DEFAULT_PAGE,
    minimum: DEFAULT_PAGE,
    description: 'Número de página, desde 1',
  })
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(DEFAULT_PAGE, { message: 'La página debe ser mayor o igual a 1.' })
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: DEFAULT_LIMIT,
    minimum: 1,
    maximum: MAX_LIMIT,
    description: 'Cantidad de filas por página',
  })
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1.' })
  @Max(MAX_LIMIT, { message: 'El límite no puede ser mayor a 100.' })
  limit: number = DEFAULT_LIMIT;
}
