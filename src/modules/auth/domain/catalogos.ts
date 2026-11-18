/**
 * Nombres del catálogo de autorización.
 *
 * Un permiso por operación, con la forma `recurso:acción` (`AGENTS.md` §5.10). La
 * fila persistida es la fuente de verdad; estas constantes existen para que el
 * código y el seed nombren lo mismo, y para saber qué nombres exige la
 * especificación y por lo tanto no se pueden cambiar.
 */
export const NOMBRES_ROL = {
  ADMINISTRADOR: 'Administrador',
  PROFESOR: 'Profesor',
  ALUMNO: 'Alumno',
} as const;

export const NOMBRES_PERMISO = {
  ROL_CONSULTAR: 'rol:consultar',
  ROL_CREAR: 'rol:crear',
  ROL_EDITAR: 'rol:editar',
  ROL_PERMISOS: 'rol:permisos',
  PERMISO_CONSULTAR: 'permiso:consultar',
  PERMISO_CREAR: 'permiso:crear',
  PERMISO_EDITAR: 'permiso:editar',
  PERMISO_OTORGAR: 'permiso:otorgar',
} as const;

export type NombreRol = (typeof NOMBRES_ROL)[keyof typeof NOMBRES_ROL];

export type NombrePermiso = (typeof NOMBRES_PERMISO)[keyof typeof NOMBRES_PERMISO];

/** Roles que el catálogo MUST contener: renombrarlos los sacaría del catálogo. */
export const NOMBRES_ROL_REQUERIDOS: readonly string[] = Object.values(NOMBRES_ROL);

/** Permisos que el catálogo MUST contener: renombrarlos los sacaría del catálogo. */
export const NOMBRES_PERMISO_REQUERIDOS: readonly string[] = Object.values(NOMBRES_PERMISO);
