import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';

/**
 * Adaptador MikroORM del puerto de `Usuario`.
 *
 * Las dos lecturas desactivan el filtro de baja lógica a propósito: el caso de
 * uso de inicio de sesión y el guard necesitan ver al usuario dado de baja para
 * decidir el rechazo. El rol y sus permisos se traen en la misma consulta para
 * que `permisosEfectivos()` no dependa de una carga diferida fuera de la unidad
 * de trabajo.
 */
@Injectable()
export class MikroOrmUsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repositorio: EntityRepository<Usuario>,
  ) {}

  @Transactional({ context: (self: MikroOrmUsuarioRepository) => self.repositorio })
  async save(usuario: Usuario): Promise<void> {
    this.repositorio.getEntityManager().persist(usuario);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repositorio.findOne(
      { email },
      { populate: ['rol', 'rol.permisos'], filters: false },
    );
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.repositorio.findOne({ id }, { populate: ['rol', 'rol.permisos'], filters: false });
  }
}
