import { Collection } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el entrenamiento declara la colección inversa de sus ejercicios.
import { Entrenamiento } from './entrenamiento.entity.js';
// oxlint-disable-next-line import/no-cycle -- la serie declara el lado propietario de la relación.
import { Serie } from './serie.entity.js';
// oxlint-disable-next-line import/no-cycle -- el ejercicio declara la colección inversa.
import { Ejercicio } from '../../../catalogo/ejercicios/domain/entities/ejercicio.entity.js';

/**
 * Ejecución de un ejercicio dentro de un entrenamiento, con las series que el
 * alumno completó (`RN-21`, `RN-41`). Se edita y completa mientras el
 * entrenamiento está en curso.
 */
@Entity({ tableName: 'ejercicio_realizado' })
@Unique({
  name: 'ejercicio_realizado_entrenamiento_ejercicio_unique',
  properties: ['entrenamiento', 'ejercicio'],
})
@Index({ name: 'ejercicio_realizado_ejercicio_index', properties: ['ejercicio'] })
export class EjercicioRealizado {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Ejercicio, {
    fieldName: 'ejercicio_id',
    deleteRule: 'restrict',
  })
  ejercicio!: Rel<Ejercicio>;

  @ManyToOne(() => Entrenamiento, {
    fieldName: 'entrenamiento_id',
    deleteRule: 'cascade',
  })
  entrenamiento!: Rel<Entrenamiento>;

  @OneToMany(() => Serie, (serie) => serie.ejercicioRealizado)
  series = new Collection<Serie>(this);

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
