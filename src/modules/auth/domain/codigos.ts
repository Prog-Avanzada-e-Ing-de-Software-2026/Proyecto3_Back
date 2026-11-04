/**
 * Claves del catálogo de identidad y autorización.
 *
 * Los roles se identifican por `codigo` y los permisos por `nombre`: ambos son
 * datos persistidos y estas constantes solo tipan las búsquedas y la carga
 * inicial. Nunca reemplazan la fila de la base.
 */
export const CODIGOS_ROL = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

export const NOMBRES_PERMISO = {
  GESTIONAR_ALUMNOS: 'Gestionar alumnos',
  GESTIONAR_PROFESORES: 'Gestionar profesores',
  CREAR_PLAN: 'Crear plan',
} as const;

export type CodigoRol = (typeof CODIGOS_ROL)[keyof typeof CODIGOS_ROL];

export type NombrePermiso = (typeof NOMBRES_PERMISO)[keyof typeof NOMBRES_PERMISO];
