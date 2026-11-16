import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import type { FilterQuery } from '@mikro-orm/core';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';

/**
 * Adaptador MikroORM del catálogo de roles.
 *
 * El alta y la edición persisten el agregado y su colección de permisos dentro
 * de la misma transacción, declarada con `@Transactional()` sobre el
 * `EntityManager` del repositorio. Las lecturas traen la colección para no
 * depender de una carga diferida fuera de la unidad de trabajo.
 */
@Injectable()
export class MikroOrmRolRepository implements IRolRepository {
  constructor(
    @InjectRepository(Rol)
    readonly repositorio: EntityRepository<Rol>,
  ) {}

  @Transactional({ context: (self: MikroOrmRolRepository) => self.repositorio })
  async save(rol: Rol): Promise<void> {
    this.repositorio.getEntityManager().persist(rol);
  }

  async findByNombre(nombre: string): Promise<Rol | null> {
    return this.repositorio.findOne({ nombre }, { populate: ['permisos'] });
  }

  async findById(id: number): Promise<Rol | null> {
    return this.repositorio.findOne({ id }, { populate: ['permisos'] });
  }

  async findAll(): Promise<Rol[]> {
    return this.repositorio.find({}, { populate: ['permisos'], orderBy: { nombre: 'asc' } });
  }

  async existeNombre(nombre: string, exceptoId?: number): Promise<boolean> {
    const filtro: FilterQuery<Rol> = { nombre };

    if (exceptoId !== undefined) {
      filtro.id = { $ne: exceptoId };
    }

    const encontrado = await this.repositorio.findOne(filtro, { filters: false });

    return encontrado !== null;
  }
}
