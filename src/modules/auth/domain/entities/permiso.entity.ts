import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { normalizarTextoObligatorio } from '../../../../common/domain/validaciones.js';
import type { CrearPermiso } from './permiso.input.js';

/**
 * Permiso del catálogo de autorización. Es raíz de su propio agregado y no
 * conoce a los roles que lo usan. Su nombre es la identidad del permiso.
 */
@Entity({ tableName: 'permiso' })
export class Permiso {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text', unique: true })
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion: string | null = null;

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

  static crear(datos: CrearPermiso): Permiso {
    const permiso = new Permiso();
    permiso.nombre = normalizarTextoObligatorio(datos.nombre, 'NOMBRE');
    permiso.descripcion = datos.descripcion ?? null;

    return permiso;
  }

  estaActivo(): boolean {
    return this.deletedAt === null;
  }
}
