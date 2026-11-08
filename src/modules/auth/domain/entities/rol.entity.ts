import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ErrorSemantico } from '../../../../common/domain/errors/error-semantico.js';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import { Permiso } from './permiso.entity.js';
import type { CrearRol } from './rol.input.js';

/**
 * Rol del catálogo de autorización. Es la raíz del agregado que posee la
 * asignación de permisos: la colección solo se modifica por sus métodos.
 */
@Entity({ tableName: 'rol' })
export class Rol {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text', unique: true })
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion: string | null = null;

  @ManyToMany({ entity: () => Permiso, pivotTable: 'rol_permiso', deleteRule: 'restrict' })
  permisos = new Collection<Permiso>(this);

  @Property({ columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ columnType: 'integer', nullable: true })
  createdById: number | null = null;

  @Property({ columnType: 'timestamptz', nullable: true })
  updatedAt: Date | null = null;

  @Property({ columnType: 'integer', nullable: true })
  updatedById: number | null = null;

  @Property({ columnType: 'timestamptz', nullable: true })
  deletedAt: Date | null = null;

  @Property({ columnType: 'integer', nullable: true })
  deletedById: number | null = null;

  static crear(datos: CrearRol): Rol {
    const rol = new Rol();
    rol.nombre = normalizarTextoObligatorio(datos.nombre, 'NOMBRE');
    rol.descripcion = datos.descripcion ?? null;

    for (const permiso of datos.permisos ?? []) {
      if (rol.permisos.contains(permiso)) {
        throw new ErrorSemantico(
          'conflicto',
          'PERMISO_DUPLICADO',
          'El rol ya tiene asignado ese permiso.',
        );
      }

      rol.permisos.add(permiso);
    }

    return rol;
  }

  estaActivo(): boolean {
    return this.deletedAt === null;
  }

  asignarPermiso(permiso: Permiso): void {
    if (this.permisos.contains(permiso)) {
      throw new ErrorSemantico(
        'conflicto',
        'PERMISO_DUPLICADO',
        'El rol ya tiene asignado ese permiso.',
      );
    }

    this.permisos.add(permiso);
  }

  quitarPermiso(permiso: Permiso): void {
    if (!this.permisos.contains(permiso)) {
      throw new ErrorSemantico(
        'no_encontrado',
        'PERMISO_NO_ASIGNADO',
        'El rol no tiene asignado ese permiso.',
      );
    }

    this.permisos.remove(permiso);
  }
}
