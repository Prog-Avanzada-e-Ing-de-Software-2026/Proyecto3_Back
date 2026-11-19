import type { INestApplicationContext } from '@nestjs/common';
import { CreatePermisoUseCase } from '../modules/auth/application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from '../modules/auth/application/use-cases/create-rol.use-case.js';
import { ListPermisosUseCase } from '../modules/auth/application/use-cases/list-permisos.use-case.js';
import { ListRolesUseCase } from '../modules/auth/application/use-cases/list-roles.use-case.js';
import { NOMBRES_PERMISO, NOMBRES_ROL } from '../modules/auth/domain/catalogos.js';
import type { NombrePermiso, NombreRol } from '../modules/auth/domain/catalogos.js';
import type { CreatePermisoDto } from '../modules/auth/presentation/dto/create-permiso.dto.js';
import type { CreateRolDto } from '../modules/auth/presentation/dto/create-rol.dto.js';

// Los nombres se acotan al catálogo: el seed no puede inventar un permiso ni un
// rol que el código no conozca.
interface PermisoInicial extends CreatePermisoDto {
  nombre: NombrePermiso;
  descripcion: string;
}

interface RolInicial extends CreateRolDto {
  nombre: NombreRol;
  permisos: NombrePermiso[];
}

const PERMISOS_INICIALES: readonly PermisoInicial[] = [
  {
    nombre: NOMBRES_PERMISO.ROL_CONSULTAR,
    descripcion: 'Consultar el catálogo de roles.',
  },
  {
    nombre: NOMBRES_PERMISO.ROL_CREAR,
    descripcion: 'Dar de alta roles del catálogo.',
  },
  {
    nombre: NOMBRES_PERMISO.ROL_EDITAR,
    descripcion: 'Editar el nombre y la descripción de un rol.',
  },
  {
    nombre: NOMBRES_PERMISO.ROL_PERMISOS,
    descripcion: 'Reemplazar el conjunto de permisos de un rol.',
  },
  {
    nombre: NOMBRES_PERMISO.PERMISO_CONSULTAR,
    descripcion: 'Consultar el catálogo de permisos.',
  },
  {
    nombre: NOMBRES_PERMISO.PERMISO_CREAR,
    descripcion: 'Dar de alta permisos del catálogo.',
  },
  {
    nombre: NOMBRES_PERMISO.PERMISO_EDITAR,
    descripcion: 'Editar el nombre y la descripción de un permiso.',
  },
];

const ROLES_INICIALES: readonly RolInicial[] = [
  {
    nombre: NOMBRES_ROL.ADMINISTRADOR,
    permisos: [
      NOMBRES_PERMISO.ROL_CONSULTAR,
      NOMBRES_PERMISO.ROL_CREAR,
      NOMBRES_PERMISO.ROL_EDITAR,
      NOMBRES_PERMISO.ROL_PERMISOS,
      NOMBRES_PERMISO.PERMISO_CONSULTAR,
      NOMBRES_PERMISO.PERMISO_CREAR,
      NOMBRES_PERMISO.PERMISO_EDITAR,
    ],
  },
  // `Profesor` recibe los permisos de plan cuando exista la operación que los
  // exige (`plan:crear`, HU 1); un permiso sin endpoint no se puede ejercer.
  {
    nombre: NOMBRES_ROL.PROFESOR,
    permisos: [],
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
      await crearPermiso.execute(permiso, null);
    }
  }

  const rolesExistentes = new Set((await listarRoles.execute()).map((rol) => rol.nombre));

  for (const rol of ROLES_INICIALES) {
    if (!rolesExistentes.has(rol.nombre)) {
      await crearRol.execute(rol, null);
    }
  }
}
