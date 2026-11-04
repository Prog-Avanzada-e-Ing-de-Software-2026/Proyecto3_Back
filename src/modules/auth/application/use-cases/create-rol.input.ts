/**
 * Entrada del alta de un rol.
 *
 * Es un Input de aplicación: no valida nada y no conoce el transporte. Los
 * códigos llegan sin normalizar; el caso de uso los normaliza antes de buscar.
 */
export interface CreateRolInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  permisos: string[];
}
