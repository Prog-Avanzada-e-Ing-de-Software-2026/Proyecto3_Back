import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import type { IUsuarioRepository } from '../../domain/interfaces/usuario.repository.interface.js';

/**
 * Adaptador MikroORM del puerto de `Usuario`.
 *
 * Las lecturas habituales aplican el filtro de baja lógica del ORM. La variante
 * explícita lo desactiva para la unicidad del email, y el rol con sus permisos
 * se traen en la misma consulta para no depender de una carga diferida fuera de
 * la unidad de trabajo.
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
    return this.repositorio.findOne({ email }, { populate: ['rol', 'rol.permisos'] });
  }

  async findByEmailIncluyendoBaja(email: string): Promise<Usuario | null> {
    return this.repositorio.findOne(
      { email },
      { populate: ['rol', 'rol.permisos'], filters: false },
    );
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.repositorio.findOne({ id }, { populate: ['rol', 'rol.permisos'] });
  }
}
