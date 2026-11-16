import { SetMetadata } from '@nestjs/common';

export const CLAVE_RUTA_PUBLICA = 'rutaPublica';

/**
 * Declara una operación accesible sin sesión.
 *
 * El sistema es cerrado por defecto: el guard global protege toda ruta y solo
 * las marcadas acá quedan abiertas. Olvidar la marca cierra una ruta —visible y
 * molesto—; el error inverso sería silencioso.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(CLAVE_RUTA_PUBLICA, true);
