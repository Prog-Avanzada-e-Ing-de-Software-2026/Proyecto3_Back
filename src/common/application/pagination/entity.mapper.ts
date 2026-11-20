/**
 * Proyecta cada fila de una página a la representación que expone el caso de
 * uso. Qué campos salen del agregado lo decide el mapper de cada capacidad.
 */
export function toProjections<Entity, Projection>(
  entities: readonly Entity[],
  mapper: (entity: Entity) => Projection,
): Projection[] {
  return entities.map(mapper);
}
