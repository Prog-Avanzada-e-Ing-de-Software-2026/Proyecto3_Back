import type { INestApplicationContext } from '@nestjs/common';
import { CreatePermisoUseCase } from '../modules/auth/application/use-cases/create-permiso.use-case.js';
import { CreateRolUseCase } from '../modules/auth/application/use-cases/create-rol.use-case.js';
import { CODIGOS_PERMISO, CODIGOS_ROL } from '../modules/auth/domain/codigos.js';

interface PermisoInicial {
  codigo: string;
  nombre: string;
  descripcion: string;
}

interface RolInicial {
  codigo: string;
  nombre: string;
  permisos: string[];
}

const PERMISOS_INICIALES: readonly PermisoInicial[] = [
  {
    codigo: CODIGOS_PERMISO.GESTIONAR_ALUMNOS,
    nombre: 'Gestionar alumnos',
    descripcion: 'Dar de alta, modificar, dar de baja y reactivar alumnos.',
  },
  {
    codigo: CODIGOS_PERMISO.GESTIONAR_PROFESORES,
    nombre: 'Gestionar profesores',
    descripcion: 'Dar de alta, modificar, dar de baja y reactivar profesores.',
  },
  {
    codigo: CODIGOS_PERMISO.CREAR_PLAN,
    nombre: 'Crear plan',
    descripcion: 'Armar y modificar planes de entrenamiento.',
  },
];

const ROLES_INICIALES: readonly RolInicial[] = [
  {
    codigo: CODIGOS_ROL.ADMINISTRADOR,
    nombre: 'Administrador',
    permisos: [CODIGOS_PERMISO.GESTIONAR_ALUMNOS, CODIGOS_PERMISO.GESTIONAR_PROFESORES],
  },
  {
    codigo: CODIGOS_ROL.PROFESOR,
    nombre: 'Profesor',
    permisos: [CODIGOS_PERMISO.CREAR_PLAN],
  },
  {
    codigo: CODIGOS_ROL.ALUMNO,
    nombre: 'Alumno',
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
