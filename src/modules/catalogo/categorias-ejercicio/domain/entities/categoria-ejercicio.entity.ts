import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';

/**
 * Clasificación del ejercicio según su objetivo. Raíz de un agregado de
 * catálogo propio.
 */
@Entity({ tableName: 'categoria_ejercicio' })
@Unique({
  name: 'categoria_ejercicio_nombre_lower_unique',
  expression: 'create unique index "categoria_ejercicio_nombre_lower_unique" on "categoria_ejercicio" (lower("nombre"))',
})
export class CategoriaEjercicio {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
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
}
