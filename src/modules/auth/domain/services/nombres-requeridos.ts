import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';

/**
 * Rechaza renombrar un registro cuyo nombre exige la especificación.
 *
 * Se evalúa sobre el nombre actual: cambiar de otro nombre hacia uno requerido ya
 * lo rechaza la unicidad.
 */
export function exigirNombreEditable(
  nombreActual: string,
  nombreNuevo: string,
  requeridos: readonly string[],
): void {
  if (nombreActual === nombreNuevo || !requeridos.includes(nombreActual)) {
    return;
  }

  throw new ErrorSemantico(
    'conflicto',
    'NOMBRE_REQUERIDO',
    `El nombre ${nombreActual} es requerido por el catálogo y no se puede cambiar.`,
  );
}
