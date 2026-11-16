import type { Usuario } from '../../domain/entities/usuario.entity.js';

/**
 * Lo que el sistema concede al abrir o renovar una sesión.
 *
 * `HU 14` exige que el cliente muestre solo las funciones del rol, y para eso
 * necesita el rol y los permisos efectivos junto con la sesión.
 */
export interface SesionOtorgada {
  id: number;
  email: string;
  rol: string;
  permisos: string[];
}

/** Proyección común del login y de la renovación: nunca expone el hash. */
export function sesionOtorgadaDe(usuario: Usuario): SesionOtorgada {
  return {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol.nombre,
    permisos: usuario.permisosEfectivos().map((permiso) => permiso.nombre),
  };
}
