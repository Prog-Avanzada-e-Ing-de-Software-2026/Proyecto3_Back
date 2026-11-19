import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { PermisoResumen } from '../use-cases/permiso-resumen.result.js';

/** Proyecta el agregado a un resumen plano. */
export function toPermisoResumen(permiso: Permiso): PermisoResumen {
  return {
    id: permiso.id,
    nombre: permiso.nombre,
    descripcion: permiso.descripcion,
  };
}
