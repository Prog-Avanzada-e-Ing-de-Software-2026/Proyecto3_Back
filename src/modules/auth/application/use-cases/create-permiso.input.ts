/**
 * Entrada del alta de un permiso del catálogo.
 *
 * Es un Input de aplicación: no valida nada y no conoce el transporte. El
 * código llega sin normalizar; el caso de uso lo normaliza antes de buscar.
 */
export interface CreatePermisoInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}
