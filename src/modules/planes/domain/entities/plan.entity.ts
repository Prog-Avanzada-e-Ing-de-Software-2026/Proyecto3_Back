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
// oxlint-disable-next-line import/no-cycle -- el alumno declara la colección inversa de sus planes.
import { Alumno } from '../../../alumnos/domain/entities/alumno.entity.js';
// oxlint-disable-next-line import/no-cycle -- el profesor declara la colección inversa de sus planes.
import { Profesor } from '../../../profesores/domain/entities/profesor.entity.js';
// oxlint-disable-next-line import/no-cycle -- el objetivo declara la colección inversa de sus planes.
import { ObjetivoPlan } from '../../../catalogo/objetivos-plan/domain/entities/objetivo-plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- el entrenamiento referencia al plan vigente.
import { Entrenamiento } from '../../../entrenamientos/domain/entities/entrenamiento.entity.js';
// oxlint-disable-next-line import/no-cycle -- el día del plan declara el lado propietario de la relación.
import { DiaDelPlan } from './dia-del-plan.entity.js';
// oxlint-disable-next-line import/no-cycle -- la prescripción semanal declara el lado propietario de la relación.
import { PrescripcionSemanal } from './prescripcion-semanal.entity.js';
// oxlint-disable-next-line import/no-cycle -- el ejercicio planificado declara el lado propietario de la relación.
import { EjercicioPlanificado } from './ejercicio-planificado.entity.js';

/**
 * Raíz del agregado Plan: la planificación mensual que un profesor arma para un
 * alumno (`HU 1`, `RN-1`..`RN-15`). El estado (vigente, futuro, finalizado) no
 * se persiste: se calcula a partir de las fechas (`RN-8`).
 */
@Entity({ tableName: 'plan' })
// El número de plan es sucesivo por alumno (`HU 1`), pero la unicidad se resuelve
// en el caso de uso: la base solo indexa la búsqueda del próximo número.
@Index({ name: 'plan_alumno_numero_index', properties: ['alumno', 'numeroPlan'] })
@Index({ name: 'plan_alumno_fecha_desde_index', properties: ['alumno', 'fechaDesde'] })
@Index({ name: 'plan_profesor_id_index', properties: ['profesor'] })
@Index({ name: 'plan_objetivo_id_index', properties: ['objetivo'] })
export class Plan {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ columnType: 'date' })
  fechaDesde!: string;

  @Property({ columnType: 'date' })
  fechaHasta!: string;

  @Property({ type: 'integer' })
  numeroPlan!: number;

  @Property({ columnType: 'timestamptz' })
  fechaRegistro!: Date;

  @ManyToOne(() => Alumno, {
    fieldName: 'alumno_id',
    deleteRule: 'restrict',
  })
  alumno!: Rel<Alumno>;

  @ManyToOne(() => Profesor, {
    fieldName: 'profesor_id',
    deleteRule: 'restrict',
  })
  profesor!: Rel<Profesor>;

  @ManyToOne(() => ObjetivoPlan, {
    fieldName: 'objetivo_id',
    deleteRule: 'restrict',
  })
  objetivo!: Rel<ObjetivoPlan>;

  // Los bloques de movilidad y core se distinguen por `EjercicioPlanificado.bloque`:
  // dos colecciones sobre la misma clave foránea no son representables en el ORM.
  @OneToMany(() => EjercicioPlanificado, (ejercicioPlanificado) => ejercicioPlanificado.plan)
  ejerciciosPlanificados = new Collection<EjercicioPlanificado>(this);

  @OneToMany(() => DiaDelPlan, (diaDelPlan) => diaDelPlan.plan)
  diasPlan = new Collection<DiaDelPlan>(this);

  @OneToMany(() => PrescripcionSemanal, (prescripcionSemanal) => prescripcionSemanal.plan)
  prescripcionesSemanales = new Collection<PrescripcionSemanal>(this);

  @OneToMany(() => Entrenamiento, (entrenamiento) => entrenamiento.plan)
  entrenamientos = new Collection<Entrenamiento>(this);

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
