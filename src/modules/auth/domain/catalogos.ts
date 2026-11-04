/**
 * Claves del catálogo de identidad y autorización.
 *
 * Roles y permisos se identifican por `nombre`: ambos son datos persistidos y
 * estas constantes solo tipan las búsquedas y la carga inicial. Nunca
 * reemplazan la fila de la base.
 */
export const NOMBRES_ROL = {
  ADMINISTRADOR: 'Administrador',
  PROFESOR: 'Profesor',
  ALUMNO: 'Alumno',
} as const;

export const NOMBRES_PERMISO = {
  GESTIONAR_ALUMNOS: 'Gestionar alumnos',
  GESTIONAR_PROFESORES: 'Gestionar profesores',
  CREAR_PLAN: 'Crear plan',
} as const;

export type NombreRol = (typeof NOMBRES_ROL)[keyof typeof NOMBRES_ROL];

export type NombrePermiso = (typeof NOMBRES_PERMISO)[keyof typeof NOMBRES_PERMISO];
