import { SetMetadata } from '@nestjs/common';

export const CLAVE_PERMISO = 'permisoRequerido';

/**
 * Declara el permiso del catálogo que exige la operación.
 *
 * El nombre tiene que ser uno de los persistidos —usar las constantes de
 * `src/seeder/catalogos.ts`—: un nombre mal escrito compila y deja la operación
 * sin nadie que pueda ejercerla, es decir, cerrada para todos o abierta para
 * todos según cómo se lea. Se aplica al método o al controller, y el método gana.
 */
export const RequierePermiso = (nombre: string): MethodDecorator & ClassDecorator =>
  SetMetadata(CLAVE_PERMISO, nombre);
