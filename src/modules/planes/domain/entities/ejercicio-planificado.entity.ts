import type { Rel } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el plan declara la colección inversa de sus ejercicios.
import { Plan } from './plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el día declara la colección inversa de sus ejercicios.
import { DiaDelPlan } from './dia-del-plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el ejercicio declara la colección inversa.
import { Ejercicio } from '../../../catalogo/ejercicios/domain/entities/ejercicio.entity.js';
import { BLOQUES_PLAN } from '../catalogos.js';
import type { BloquePlan } from '../catalogos.js';

/**
 * Inclusión de un ejercicio en un bloque del plan, en una posición determinada.
 * Cuelga del plan en movilidad y core, y del día en fuerza.
 */
@Entity({ tableName: 'ejercicio_planificado' })
@Index({ name: 'ejercicio_planificado_plan_bloque_index', properties: ['plan', 'bloque'] })
@Index({ name: 'ejercicio_planificado_dia_del_plan_index', properties: ['diaDelPlan'] })
@Index({ name: 'ejercicio_planificado_ejercicio_index', properties: ['ejercicio'] })
export class EjercicioPlanificado {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer' })
  orden!: number;

  @Enum({ items: [...BLOQUES_PLAN] })
  bloque!: BloquePlan;

  @ManyToOne(() => Ejercicio, {
    fieldName: 'ejercicio_id',
    deleteRule: 'restrict',
  })
  ejercicio!: Rel<Ejercicio>;

  @ManyToOne(() => Plan, {
    fieldName: 'plan_id',
    nullable: true,
    deleteRule: 'cascade',
  })
  plan: Rel<Plan> | null = null;

  @ManyToOne(() => DiaDelPlan, {
    fieldName: 'dia_del_plan_id',
    nullable: true,
    deleteRule: 'cascade',
  })
  diaDelPlan: Rel<DiaDelPlan> | null = null;

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
