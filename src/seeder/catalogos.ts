/**
 * Nombres del catálogo inicial de identidad y autorización.
 *
 * Son datos de la carga inicial, no el catálogo real: roles y permisos se
 * identifican por `nombre` en la base y estas constantes solo tipan el seed.
 * Nunca reemplazan la fila persistida.
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

export type NombrePermiso =
  (typeof NOMBRES_PERMISO)[keyof typeof NOMBRES_PERMISO];
