import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el ejercicio declara el lado propietario de la relación.
import { Ejercicio } from '../../../../catalogo/ejercicios/domain/entities/ejercicio.entity.js';

/**
 * Medida en la que se expresa la cantidad de un ejercicio. Raíz de un agregado
 * de catálogo propio.
 */
@Entity({ tableName: 'unidad' })
@Unique({
  name: 'unidad_nombre_lower_unique',
  expression: 'create unique index "unidad_nombre_lower_unique" on "unidad" (lower("nombre"))',
})
export class Unidad {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion: string | null = null;

  @OneToMany(() => Ejercicio, (ejercicio) => ejercicio.unidad)
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
