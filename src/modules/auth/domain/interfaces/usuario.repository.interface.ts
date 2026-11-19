import type { Usuario } from '../entities/usuario.entity.js';

/**
 * Puerto de persistencia de `Usuario` para autenticación.
 *
 * Las lecturas habituales excluyen los usuarios dados de baja: el filtro lo
 * aplica esta implementación y no cada consulta. La única excepción es la
 * unicidad del email, que no se libera con la baja y por eso pide la variante
 * explícita.
 */
export interface IUsuarioRepository {
  save(usuario: Usuario): Promise<void>;

  findByEmail(email: string): Promise<Usuario | null>;

  findByEmailIncluyendoBaja(email: string): Promise<Usuario | null>;

  findById(id: number): Promise<Usuario | null>;
}
