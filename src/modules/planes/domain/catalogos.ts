/**
 * Bloques en que se divide un plan. Se persiste el nombre del bloque, no su
 * posición: el orden de los bloques no es una decisión de negocio.
 */
export const BLOQUES_PLAN = ['movilidad', 'core', 'fuerza'] as const;

export type BloquePlan = (typeof BLOQUES_PLAN)[number];
