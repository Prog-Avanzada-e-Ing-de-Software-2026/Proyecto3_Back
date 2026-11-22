import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el ejercicio declara el lado propietario de la relación.
import { Ejercicio } from '../../../../catalogo/ejercicios/domain/entities/ejercicio.entity.js';

/**
 * Clasificación del ejercicio según su objetivo (`HU 27`, `RN-37`).
 * Raíz de un agregado de catálogo propio.
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

  @OneToMany(() => Ejercicio, (ejercicio) => ejercicio.categoria)
  ejercicios = new Collection<Ejercicio>(this);

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
