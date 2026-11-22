/**
 * Estados de un entrenamiento (`RN-20`, `RN-23`, `RN-24`). Un entrenamiento en
 * curso es editable; el finalizado es inmutable.
 */
export const ESTADOS_ENTRENAMIENTO = ['en_curso', 'finalizado'] as const;

export type EstadoEntrenamiento = (typeof ESTADOS_ENTRENAMIENTO)[number];
