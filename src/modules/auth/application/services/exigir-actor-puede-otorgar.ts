import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import { exigirPermisosOtorgables } from '../../domain/services/permisos-otorgables.js';
import type { FindUsuarioByIdUseCase } from '../use-cases/find-usuario-by-id.use-case.js';

/**
 * Verifica que el actor pueda otorgar los permisos que la operación asigna.
 *
 * Solo aplica cuando hay actor y hay permisos pedidos: la carga inicial no tiene
 * sesión. Un actor que no se puede leer corta la operación en lugar de asumir
 * que puede todo.
 */
export async function exigirActorPuedeOtorgar(
  actorId: number | null | undefined,
  permisos: Permiso[],
  buscarActor: FindUsuarioByIdUseCase,
): Promise<void> {
  if (actorId === null || actorId === undefined || permisos.length === 0) {
    return;
  }

  const actor = await buscarActor.execute(actorId);

  if (actor === null) {
    throw new ErrorSemantico(
      'no_autenticado',
      'SESION_INVALIDA',
      'La operación requiere una sesión válida.',
    );
  }

  exigirPermisosOtorgables(actor, permisos);
}
