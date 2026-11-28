import type { Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el plan declara la colección inversa de sus prescripciones.
import { Plan } from './plan.entity.js';

/**
 * Cantidad a realizar de cada ejercicio en una semana del plan. Todos los
 * ejercicios comparten la progresión, por eso cuelga del plan y no de un
 * ejercicio planificado.
 */
@Entity({ tableName: 'prescripcion_semanal' })
@Unique({ name: 'prescripcion_semanal_plan_semana_unique', properties: ['plan', 'nroSemana'] })
export class PrescripcionSemanal {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer' })
  series!: number;

  @Property({ type: 'integer' })
  cantidadObjetivo!: number;

  @Property({ type: 'integer', nullable: true })
  rir: number | null = null;

  @Property({ type: 'integer', nullable: true })
  segundosDeDescanso: number | null = null;

  @Property({ type: 'integer' })
  nroSemana!: number;

  @ManyToOne(() => Plan, {
    fieldName: 'plan_id',
    deleteRule: 'cascade',
  })
  plan!: Rel<Plan>;

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
