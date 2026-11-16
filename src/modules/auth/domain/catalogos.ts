/**
 * Nombres del catálogo de autorización.
 *
 * La fila persistida es la fuente de verdad; estas constantes existen para que
 * el código y el seed nombren lo mismo, y para saber qué nombres exige la
 * especificación y por lo tanto no se pueden cambiar.
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
  GESTIONAR_ROLES: 'Gestionar roles',
  GESTIONAR_PERMISOS: 'Gestionar permisos',
} as const;

export type NombreRol = (typeof NOMBRES_ROL)[keyof typeof NOMBRES_ROL];

export type NombrePermiso = (typeof NOMBRES_PERMISO)[keyof typeof NOMBRES_PERMISO];

/** Roles que el catálogo MUST contener: renombrarlos los sacaría del catálogo. */
export const NOMBRES_ROL_REQUERIDOS: readonly string[] = Object.values(NOMBRES_ROL);

/** Permisos que el catálogo MUST contener: renombrarlos los sacaría del catálogo. */
export const NOMBRES_PERMISO_REQUERIDOS: readonly string[] = Object.values(NOMBRES_PERMISO);
