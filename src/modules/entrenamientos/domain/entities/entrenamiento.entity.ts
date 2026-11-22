import { Collection } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el alumno declara la colección inversa de sus entrenamientos.
import { Alumno } from '../../../alumnos/domain/entities/alumno.entity.js';
// oxlint-disable-next-line import/no-cycle -- el plan declara la colección inversa de sus entrenamientos.
import { Plan } from '../../../planes/domain/entities/plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el día del plan declara la colección inversa de sus entrenamientos.
import { DiaDelPlan } from '../../../planes/domain/entities/dia-del-plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el ejercicio realizado declara el lado propietario de la relación.
import { EjercicioRealizado } from './ejercicio-realizado.entity.js';
import { ESTADOS_ENTRENAMIENTO } from '../catalogos.js';
import type { EstadoEntrenamiento } from '../catalogos.js';

/**
 * Raíz del agregado Entrenamiento: la visita de un alumno al gimnasio
 * (`HU 8`..`HU 13`, `RN-16`..`RN-24`). Toma el plan vigente como referencia y
 * registra la semana elegida, que define la carga prescripta que se le mostró.
 */
@Entity({ tableName: 'entrenamiento' })
@Unique({
  name: 'entrenamiento_en_curso_unique',
  properties: ['alumno'],
  where: { estado: 'en_curso' },
})
@Index({ name: 'entrenamiento_alumno_fecha_index', properties: ['alumno', 'fecha'] })
@Index({ name: 'entrenamiento_plan_id_index', properties: ['plan'] })
@Index({ name: 'entrenamiento_dia_del_plan_id_index', properties: ['diaDelPlan'] })
export class Entrenamiento {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ columnType: 'timestamptz' })
  fecha!: Date;

  @Property({ type: 'integer' })
  nroSemana!: number;

  @Enum({ items: [...ESTADOS_ENTRENAMIENTO] })
  estado!: EstadoEntrenamiento;

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

  @ManyToOne(() => DiaDelPlan, {
    fieldName: 'dia_del_plan_id',
    deleteRule: 'restrict',
  })
  diaDelPlan!: Rel<DiaDelPlan>;

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
