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
// oxlint-disable-next-line import/no-cycle -- el alumno declara la colección inversa de sus entrenamientos.
import { Alumno } from '../../../alumnos/domain/entities/alumno.entity.js';
// oxlint-disable-next-line import/no-cycle -- el plan declara la colección inversa de sus entrenamientos.
import { Plan } from '../../../planes/domain/entities/plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el ejercicio realizado declara el lado propietario de la relación.
import { EjercicioRealizado } from './ejercicio-realizado.entity.js';

/**
 * Raíz del agregado Entrenamiento: la visita de un alumno al gimnasio. Toma el
 * plan vigente como referencia y registra la semana y el día elegidos, que
 * definen la carga prescripta que se le mostró.
 */
@Entity({ tableName: 'entrenamiento' })
@Index({ name: 'entrenamiento_alumno_fecha_index', properties: ['alumno', 'fecha'] })
@Index({ name: 'entrenamiento_plan_id_index', properties: ['plan'] })
export class Entrenamiento {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ columnType: 'timestamptz' })
  fecha!: Date;

  @Property({ type: 'integer' })
  nroSemana!: number;

  // Número del día dentro del plan: el día es interno al agregado Plan, así que
  // se referencia por su número y no por identidad.
  @Property({ type: 'integer' })
  nroDiaPlan!: number;

  @Property({ type: 'text', nullable: true })
  comentario: string | null = null;

  @ManyToOne(() => Alumno, {
    fieldName: 'alumno_id',
    deleteRule: 'restrict',
  })
  alumno!: Rel<Alumno>;

  @ManyToOne(() => Plan, {
    fieldName: 'plan_id',
    deleteRule: 'restrict',
  })
  plan!: Rel<Plan>;

  @OneToMany(() => EjercicioRealizado, (ejercicioRealizado) => ejercicioRealizado.entrenamiento)
  ejerciciosRealizados = new Collection<EjercicioRealizado>(this);

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
