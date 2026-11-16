import type { INestApplicationContext } from '@nestjs/common';
import { CreatePermisoUseCase } from '../modules/auth/application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from '../modules/auth/application/use-cases/create-rol.use-case.js';
import { ListPermisosUseCase } from '../modules/auth/application/use-cases/list-permisos.use-case.js';
import { ListRolesUseCase } from '../modules/auth/application/use-cases/list-roles.use-case.js';
import { NOMBRES_PERMISO, NOMBRES_ROL } from '../modules/auth/domain/catalogos.js';
import type { NombrePermiso, NombreRol } from '../modules/auth/domain/catalogos.js';

interface PermisoInicial {
  nombre: NombrePermiso;
  descripcion: string;
}

interface RolInicial {
  nombre: NombreRol;
  permisos: NombrePermiso[];
}

const PERMISOS_INICIALES: readonly PermisoInicial[] = [
  {
    nombre: NOMBRES_PERMISO.GESTIONAR_ALUMNOS,
    descripcion: 'Dar de alta, modificar, dar de baja y reactivar alumnos.',
  },
  {
    nombre: NOMBRES_PERMISO.GESTIONAR_PROFESORES,
    descripcion: 'Dar de alta, modificar, dar de baja y reactivar profesores.',
  },
  {
    nombre: NOMBRES_PERMISO.CREAR_PLAN,
    descripcion: 'Armar y modificar planes de entrenamiento.',
  },
  {
    nombre: NOMBRES_PERMISO.GESTIONAR_ROLES,
    descripcion: 'Dar de alta y editar roles del catálogo de autorización.',
  },
  {
    nombre: NOMBRES_PERMISO.GESTIONAR_PERMISOS,
    descripcion: 'Dar de alta y editar permisos del catálogo de autorización.',
  },
];

const ROLES_INICIALES: readonly RolInicial[] = [
  {
    nombre: NOMBRES_ROL.ADMINISTRADOR,
    permisos: [
      NOMBRES_PERMISO.GESTIONAR_ALUMNOS,
      NOMBRES_PERMISO.GESTIONAR_PROFESORES,
      NOMBRES_PERMISO.GESTIONAR_ROLES,
      NOMBRES_PERMISO.GESTIONAR_PERMISOS,
    ],
  },
  {
    nombre: NOMBRES_ROL.PROFESOR,
    permisos: [NOMBRES_PERMISO.CREAR_PLAN],
  },
  {
    nombre: NOMBRES_ROL.ALUMNO,
    permisos: [],
  },
];

/**
 * Carga inicial del catálogo de identidad y autorización.
 *
 * Solo resuelve los casos de uso del módulo `auth` y los ejecuta en orden: la
 * creación, la validación y la auditoría viven en el módulo, no acá. Es
 * idempotente, así que repetirla no duplica filas.
 */
export async function runCatalogoIdentidad(
  app: INestApplicationContext,
): Promise<void> {
  const crearPermiso = app.get(CreatePermisoUseCase);
  const crearRol = app.get(CreateRolUseCase);
  const listarPermisos = app.get(ListPermisosUseCase);
  const listarRoles = app.get(ListRolesUseCase);

  // El alta rechaza duplicados; decidir qué falta es tarea de la carga inicial.
  const permisosExistentes = new Set(
    (await listarPermisos.execute()).map((permiso) => permiso.nombre),
  );

  for (const permiso of PERMISOS_INICIALES) {
    if (!permisosExistentes.has(permiso.nombre)) {
      await crearPermiso.execute(permiso);
    }
  }

  const rolesExistentes = new Set((await listarRoles.execute()).map((rol) => rol.nombre));

  for (const rol of ROLES_INICIALES) {
    if (!rolesExistentes.has(rol.nombre)) {
      await crearRol.execute(rol);
    }
  }
}
