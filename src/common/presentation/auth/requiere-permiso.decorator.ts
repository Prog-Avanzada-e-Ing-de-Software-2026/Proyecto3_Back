import { SetMetadata } from '@nestjs/common';

export const CLAVE_PERMISO = 'permisoRequerido';

/**
 * Declara el permiso del catálogo que exige la operación.
 *
 * El nombre tiene que ser uno de los persistidos —usar las constantes de
 * `src/modules/auth/domain/catalogos.ts`—: un nombre mal escrito compila y deja la
 * operación cerrada para todos.
 *
 * Se aplica al handler o al controller, y el del handler gana porque el guard usa
 * `getAllAndOverride` con el handler primero (`auth.guard.ts`). Devuelve
 * `MethodDecorator & ClassDecorator` por esa doble capa.
 */
export const RequierePermiso = (nombre: string): MethodDecorator & ClassDecorator =>
  SetMetadata(CLAVE_PERMISO, nombre);
