import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';

/**
 * Adaptador MikroORM del catálogo de roles.
 *
 * El alta persiste el agregado y su colección de permisos en la misma
 * transacción; las lecturas traen la colección para no depender de una carga
 * diferida fuera de la unidad de trabajo.
 */
@Injectable()
export class MikroOrmRolRepository implements IRolRepository {
  constructor(
    @InjectRepository(Rol)
    private readonly repositorio: EntityRepository<Rol>,
  ) {}

  async save(rol: Rol): Promise<void> {
    await this.repositorio.getEntityManager().transactional(async (em) => {
      em.persist(rol);
    });
  }

  async findByCodigo(codigo: string): Promise<Rol | null> {
    return this.repositorio.findOne({ codigo }, { populate: ['permisos'] });
  }
}
