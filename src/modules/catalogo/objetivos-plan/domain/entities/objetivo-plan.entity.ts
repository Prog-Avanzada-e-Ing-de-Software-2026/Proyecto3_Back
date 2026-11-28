import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el plan declara el lado propietario de la relación.
import { Plan } from '../../../../planes/domain/entities/plan.entity.js';

/**
 * Clasificación de los planes según lo que se busca lograr. Raíz de un agregado
 * de catálogo propio.
 */
@Entity({ tableName: 'objetivo_plan' })
@Unique({
  name: 'objetivo_plan_nombre_lower_unique',
  expression: 'create unique index "objetivo_plan_nombre_lower_unique" on "objetivo_plan" (lower("nombre"))',
})
export class ObjetivoPlan {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion: string | null = null;

  @OneToMany(() => Plan, (plan) => plan.objetivo)
  planes = new Collection<Plan>(this);

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
