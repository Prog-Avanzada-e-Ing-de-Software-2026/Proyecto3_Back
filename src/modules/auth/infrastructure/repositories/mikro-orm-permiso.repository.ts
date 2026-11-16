import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import type { FilterQuery } from '@mikro-orm/core';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Permiso } from '../../domain/entities/permiso.entity.js';
import type { IPermisoRepository } from '../../domain/interfaces/permiso.repository.interface.js';

/**
 * Adaptador MikroORM del catálogo de permisos.
 *
 * El límite transaccional del alta y la edición lo declara `@Transactional()`
 * sobre el `EntityManager` de este repositorio: la transacción se abre en el
 * método que escribe y el caso de uso no la maneja a mano.
 */
@Injectable()
export class MikroOrmPermisoRepository implements IPermisoRepository {
  constructor(
    @InjectRepository(Permiso)
    readonly repositorio: EntityRepository<Permiso>,
  ) {}

  @Transactional({ context: (self: MikroOrmPermisoRepository) => self.repositorio })
  async save(permiso: Permiso): Promise<void> {
    this.repositorio.getEntityManager().persist(permiso);
  }

  async findByNombre(nombre: string): Promise<Permiso | null> {
    return this.repositorio.findOne({ nombre });
  }

  async findById(id: number): Promise<Permiso | null> {
    return this.repositorio.findOne({ id });
  }

  async findAll(): Promise<Permiso[]> {
    return this.repositorio.find({}, { orderBy: { nombre: 'asc' } });
  }

  async existeNombre(nombre: string, exceptoId?: number): Promise<boolean> {
    const filtro: FilterQuery<Permiso> = { nombre };

    if (exceptoId !== undefined) {
      filtro.id = { $ne: exceptoId };
    }

    const encontrado = await this.repositorio.findOne(filtro, { filters: false });

    return encontrado !== null;
  }
}
