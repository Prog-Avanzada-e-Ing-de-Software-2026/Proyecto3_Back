/** Proyección de un rol para las lecturas del catálogo. */
export interface RolResumen {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
}
