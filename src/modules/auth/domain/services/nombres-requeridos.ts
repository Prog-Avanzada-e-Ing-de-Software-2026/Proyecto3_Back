import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';

/**
 * Rechaza renombrar un registro cuyo nombre exige la especificación.
 *
 * El catálogo MUST contener los tres roles y los cinco permisos: cambiarles el
 * nombre los saca del catálogo y rompe el requisito sin que nada lo note. Se
 * evalúa sobre el nombre **actual**; cambiar de otro nombre hacia uno requerido
 * ya lo rechaza la unicidad.
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
