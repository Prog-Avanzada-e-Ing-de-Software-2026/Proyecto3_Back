/**
 * Datos de construcción de un `Permiso`.
 *
 * Es el contrato de entrada de `Permiso.crear`: no valida nada por sí mismo y
 * las invariantes las aplica la raíz del agregado.
 */
export interface CrearPermiso {
  nombre: string;
  descripcion?: string | null;
  createdAt: Date;
  createdById?: number | null;
}
