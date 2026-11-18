import type { Rol } from '../../domain/entities/rol.entity.js';
import type { RolResumen } from '../use-cases/rol-resumen.result.js';

/** Proyecta el agregado a un resumen plano, sin su colección de entidades. */
export function toRolResumen(rol: Rol): RolResumen {
  return {
    id: rol.id,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    permisos: rol.permisos.getItems().map((permiso) => permiso.nombre),
  };
}
