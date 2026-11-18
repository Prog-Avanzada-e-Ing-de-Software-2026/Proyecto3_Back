import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { NOMBRES_PERMISO } from '../catalogos.js';
import type { Permiso } from '../entities/permiso.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';

/**
 * Rechaza otorgar permisos que el actor no tiene.
 *
 * Cruza dos agregados —los permisos del actor y los que se quieren asignar—, así
 * que vive acá y no en una entidad. Sin esta regla, un rol con `rol:permisos`
 * se autoescala creando un rol con todos los permisos y asignándoselo.
 *
 * `permiso:otorgar` es la excepción declarada: quien lo tiene asigna cualquier
 * permiso del catálogo. Sin ella, un permiso nuevo quedaría inasignable por API,
 * porque nadie lo tiene todavía y la restricción exige tenerlo para darlo.
 */
export function exigirPermisosOtorgables(actor: Usuario, solicitados: Permiso[]): void {
  const efectivos = new Set(actor.permisosEfectivos().map((permiso) => permiso.nombre));

  if (efectivos.has(NOMBRES_PERMISO.PERMISO_OTORGAR)) {
    return;
  }

  const faltante = solicitados.find((permiso) => !efectivos.has(permiso.nombre));

  if (faltante !== undefined) {
    throw new ErrorSemantico(
      'prohibido',
      'PERMISO_NO_OTORGABLE',
      `No se puede asignar el permiso ${faltante.nombre}: el actor no lo tiene.`,
    );
  }
}
