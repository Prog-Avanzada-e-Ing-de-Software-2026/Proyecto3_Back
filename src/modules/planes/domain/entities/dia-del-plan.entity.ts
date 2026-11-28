import { Collection } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el plan declara la colección inversa de sus días.
import { Plan } from './plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el ejercicio planificado declara el lado propietario de la relación.
import { EjercicioPlanificado } from './ejercicio-planificado.entity.js';

/**
 * Bloque de fuerza de una jornada del plan. Tiene identidad propia dentro del
 * plan y no existe fuera de él.
 */
@Entity({ tableName: 'dia_del_plan' })
@Index({ name: 'dia_del_plan_plan_orden_index', properties: ['plan', 'orden'] })
export class DiaDelPlan {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer' })
  orden!: number;

  @ManyToOne(() => Plan, {
    fieldName: 'plan_id',
    deleteRule: 'cascade',
  })
  plan!: Rel<Plan>;

  @OneToMany(() => EjercicioPlanificado, (ejercicioPlanificado) => ejercicioPlanificado.diaDelPlan)
  ejercicios = new Collection<EjercicioPlanificado>(this);

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
