import type { Usuario } from '../../domain/entities/usuario.entity.js';
import type { SesionOtorgada } from '../use-cases/sesion-otorgada.result.js';

/**
 * Proyección común del login y de la renovación.
 *
 * El cliente necesita el rol y los permisos efectivos para mostrar solo las
 * funciones disponibles; el hash nunca sale de la aplicación.
 */
export function toSesionOtorgada(usuario: Usuario): SesionOtorgada {
  return {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol.nombre,
    permisos: usuario.permisosEfectivos().map((permiso) => permiso.nombre),
  };
}
