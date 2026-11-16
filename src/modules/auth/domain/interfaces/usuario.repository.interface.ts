import type { Usuario } from '../entities/usuario.entity.js';

/**
 * Puerto de persistencia de `Usuario` para autenticación.
 *
 * A diferencia de las lecturas habituales, devuelve el agregado aunque esté
 * dado de baja: iniciar sesión y revalidar una sesión necesitan distinguir
 * "el email no existe" de "existe y no puede acceder". Filtrar la baja acá
 * dejaría esa decisión fuera del dominio.
 */
export interface IUsuarioRepository {
  save(usuario: Usuario): Promise<void>;

  findByEmail(email: string): Promise<Usuario | null>;

  findById(id: number): Promise<Usuario | null>;
}
