/**
 * Códigos del catálogo de identidad y autorización.
 *
 * Los códigos son datos persistidos: estas constantes solo tipan las búsquedas
 * y la carga inicial, y nunca reemplazan la fila de la base.
 */
export const CODIGOS_ROL = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

export const CODIGOS_PERMISO = {
  GESTIONAR_ALUMNOS: 'GESTIONAR_ALUMNOS',
  GESTIONAR_PROFESORES: 'GESTIONAR_PROFESORES',
  CREAR_PLAN: 'CREAR_PLAN',
} as const;

export type CodigoRol = (typeof CODIGOS_ROL)[keyof typeof CODIGOS_ROL];

export type CodigoPermiso = (typeof CODIGOS_PERMISO)[keyof typeof CODIGOS_PERMISO];
