/**
 * Datos de construcción de un `Permiso`.
 *
 * Es el contrato de entrada de `Permiso.crear`: no valida nada por sí mismo y
 * las invariantes las aplica la raíz del agregado. La auditoría del alta la
 * completa el caso de uso.
 */
export interface CrearPermiso {
  nombre: string;
  descripcion?: string | null;
}
