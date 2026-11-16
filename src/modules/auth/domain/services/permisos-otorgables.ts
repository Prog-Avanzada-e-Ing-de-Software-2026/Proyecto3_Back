import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import type { Permiso } from '../entities/permiso.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';

/**
 * Rechaza otorgar permisos que el actor no tiene.
 *
 * Sin esta regla, un rol con `Gestionar roles` se autoescala: crea un rol con
 * todos los permisos y se lo asigna. La regla cruza dos agregados —los permisos
 * del actor y los que se quieren asignar—, así que vive acá y no en una entidad.
 */
export function exigirPermisosOtorgables(actor: Usuario, solicitados: Permiso[]): void {
  const efectivos = new Set(actor.permisosEfectivos().map((permiso) => permiso.nombre));
  const faltante = solicitados.find((permiso) => !efectivos.has(permiso.nombre));

  if (faltante !== undefined) {
    throw new ErrorSemantico(
      'prohibido',
      'PERMISO_NO_OTORGABLE',
      `No se puede asignar el permiso ${faltante.nombre}: el actor no lo tiene.`,
    );
  }
}
