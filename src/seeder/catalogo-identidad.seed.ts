import type { INestApplicationContext } from '@nestjs/common';
import { CreatePermisoUseCase } from '../modules/auth/application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from '../modules/auth/application/use-cases/create-rol.use-case.js';
import { NOMBRES_PERMISO, NOMBRES_ROL } from '../modules/auth/domain/catalogos.js';

interface PermisoInicial {
  nombre: string;
  descripcion: string;
}

interface RolInicial {
  nombre: string;
  permisos: string[];
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
];

const ROLES_INICIALES: readonly RolInicial[] = [
  {
    nombre: NOMBRES_ROL.ADMINISTRADOR,
    permisos: [NOMBRES_PERMISO.GESTIONAR_ALUMNOS, NOMBRES_PERMISO.GESTIONAR_PROFESORES],
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
export async function runCatalogoIdentidad(app: INestApplicationContext): Promise<void> {
  const crearPermiso = app.get(CreatePermisoUseCase);
  const crearRol = app.get(CreateRolUseCase);

  for (const permiso of PERMISOS_INICIALES) {
    await crearPermiso.execute(permiso);
  }

  for (const rol of ROLES_INICIALES) {
    await crearRol.execute(rol);
  }
}
