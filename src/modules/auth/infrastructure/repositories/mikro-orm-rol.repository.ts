import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { Rol } from '../../domain/entities/rol.entity.js';
import type { IRolRepository } from '../../domain/interfaces/rol.repository.interface.js';
import { patronSinComodines } from './patron-ilike.js';

/**
 * Adaptador MikroORM del catálogo de roles.
 *
 * El alta y la edición persisten el agregado y su colección de permisos en una
 * sola transacción y las lecturas traen la colección cargada. El nombre se
 * compara sin distinguir mayúsculas porque es la identidad del rol.
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
    return this.repositorio.findOne(
      { nombre: { $ilike: patronSinComodines(nombre) } },
      { populate: ['permisos'] },
    );
  }

  async findById(id: number): Promise<Rol | null> {
    return this.repositorio.findOne({ id }, { populate: ['permisos'] });
  }

  async findAll(): Promise<Rol[]> {
    return this.repositorio.find({}, { populate: ['permisos'], orderBy: { nombre: 'asc' } });
  }

  async existeNombre(nombre: string, exceptoId?: number): Promise<boolean> {
    const encontrado = await this.repositorio.findOne(
      {
        nombre: { $ilike: patronSinComodines(nombre) },
        ...(exceptoId === undefined ? {} : { id: { $ne: exceptoId } }),
      },
      { filters: false },
    );

    return encontrado !== null;
  }
}
