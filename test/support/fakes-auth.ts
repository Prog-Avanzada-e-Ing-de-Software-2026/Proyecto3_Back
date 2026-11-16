import type { Permiso } from '../../src/modules/auth/domain/entities/permiso.entity.js';
import type { Rol } from '../../src/modules/auth/domain/entities/rol.entity.js';
import type { Usuario } from '../../src/modules/auth/domain/entities/usuario.entity.js';
import type { IPermisoRepository } from '../../src/modules/auth/domain/interfaces/permiso.repository.interface.js';
import type { IRolRepository } from '../../src/modules/auth/domain/interfaces/rol.repository.interface.js';
import type { IUsuarioRepository } from '../../src/modules/auth/domain/interfaces/usuario.repository.interface.js';

/**
 * Dobles en memoria de los puertos de `auth`.
 *
 * Las pruebas de aplicación necesitan el puerto completo aunque cada caso use
 * una parte: así un método nuevo en el puerto no obliga a tocar cada spec.
 */
export class PermisoRepositoryFalso implements IPermisoRepository {
  readonly guardados: Permiso[] = [];
  private proximoId = 1;

  async save(permiso: Permiso): Promise<void> {
    if (permiso.id === undefined) {
      permiso.id = this.proximoId++;
    }

    this.guardados.push(permiso);
  }

  async findByNombre(nombre: string): Promise<Permiso | null> {
    return this.guardados.find((permiso) => permiso.nombre === nombre) ?? null;
  }

  async findById(id: number): Promise<Permiso | null> {
    return this.guardados.find((permiso) => permiso.id === id) ?? null;
  }

  async findAll(): Promise<Permiso[]> {
    return [...this.guardados];
  }

  async existeNombre(nombre: string, exceptoId?: number): Promise<boolean> {
    return this.guardados.some(
      (permiso) => permiso.nombre === nombre && (exceptoId === undefined || permiso.id !== exceptoId),
    );
  }

  precargar(...permisos: Permiso[]): void {
    this.guardados.push(...permisos);

    for (const permiso of permisos) {
      if (typeof permiso.id === 'number') {
        this.proximoId = Math.max(this.proximoId, permiso.id + 1);
      }
    }
  }
}

export class RolRepositoryFalso implements IRolRepository {
  readonly guardados: Rol[] = [];
  private proximoId = 1;

  async save(rol: Rol): Promise<void> {
    if (rol.id === undefined) {
      rol.id = this.proximoId++;
    }

    this.guardados.push(rol);
  }

  async findByNombre(nombre: string): Promise<Rol | null> {
    return this.guardados.find((rol) => rol.nombre === nombre) ?? null;
  }

  async findById(id: number): Promise<Rol | null> {
    return this.guardados.find((rol) => rol.id === id) ?? null;
  }

  async findAll(): Promise<Rol[]> {
    return [...this.guardados];
  }

  async existeNombre(nombre: string, exceptoId?: number): Promise<boolean> {
    return this.guardados.some((rol) => rol.nombre === nombre && (exceptoId === undefined || rol.id !== exceptoId));
  }

  precargar(...roles: Rol[]): void {
    this.guardados.push(...roles);

    for (const rol of roles) {
      if (typeof rol.id === 'number') {
        this.proximoId = Math.max(this.proximoId, rol.id + 1);
      }
    }
  }
}

export class UsuarioRepositoryFalso implements IUsuarioRepository {
  constructor(private readonly usuarios: Usuario[] = []) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.email === email) ?? null;
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.id === id) ?? null;
  }
}
