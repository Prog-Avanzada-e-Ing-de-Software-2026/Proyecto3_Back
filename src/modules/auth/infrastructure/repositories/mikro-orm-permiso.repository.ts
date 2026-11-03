import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';

/**
 * Adaptador MikroORM del catálogo de permisos.
 *
 * Abre la transacción del alta: el límite transaccional pertenece a la
 * implementación del puerto, no al caso de uso.
 */
@Injectable()
export class MikroOrmPermisoRepository implements IPermisoRepository {
  constructor(
    @InjectRepository(Permiso)
    private readonly repositorio: EntityRepository<Permiso>,
  ) {}

  async save(permiso: Permiso): Promise<void> {
    await this.repositorio.getEntityManager().transactional(async (em) => {
      em.persist(permiso);
    });
  }

  async findByCodigo(codigo: string): Promise<Permiso | null> {
    return this.repositorio.findOne({ codigo });
  }
}
