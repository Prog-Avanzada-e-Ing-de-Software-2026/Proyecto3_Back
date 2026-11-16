import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import type { Permiso } from '../../domain/entities/permiso.entity.js';
import type { FindPermisoByNombreUseCase } from './find-permiso-by-nombre.use-case.js';

/**
 * Resuelve una lista de nombres a permisos vigentes.
 *
 * Un nombre inexistente corta la operación antes de cualquier escritura: el
 * conjunto pedido se valida completo o no se aplica. Los repetidos los rechaza
 * la raíz del rol al construir la colección.
 */
export async function resolverPermisos(
  nombres: string[],
  buscar: FindPermisoByNombreUseCase,
): Promise<Permiso[]> {
  const permisos: Permiso[] = [];
  const vistos = new Set<string>();

  for (const nombre of nombres) {
    const permiso = await buscar.execute(nombre);

    if (permiso === null) {
      throw new ErrorSemantico(
        'no_encontrado',
        'PERMISO_NO_ENCONTRADO',
        `El permiso ${nombre} no existe.`,
      );
    }

    if (vistos.has(permiso.nombre)) {
      throw new ErrorSemantico(
        'conflicto',
        'PERMISO_DUPLICADO',
        `El permiso ${permiso.nombre} está repetido en la solicitud.`,
      );
    }

    vistos.add(permiso.nombre);
    permisos.push(permiso);
  }

  return permisos;
}
