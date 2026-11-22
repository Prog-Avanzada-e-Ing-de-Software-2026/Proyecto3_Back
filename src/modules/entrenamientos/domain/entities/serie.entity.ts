import { DecimalType } from '@mikro-orm/core';
import type { Rel } from '@mikro-orm/core';
import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
// oxlint-disable-next-line import/no-cycle -- el ejercicio realizado declara la colección inversa de sus series.
import { EjercicioRealizado } from './ejercicio-realizado.entity.js';

/**
 * Ejecución única de un ejercicio (`RN-22`, `RN-41`). La cantidad se interpreta
 * según la unidad del ejercicio; el peso es opcional y puede ser cero.
 */
@Entity({ tableName: 'serie' })
@Index({ name: 'serie_ejercicio_realizado_index', properties: ['ejercicioRealizado'] })
export class Serie {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'integer' })
  cantidad!: number;

  @Property({
    type: new DecimalType('number'),
    columnType: 'numeric(6,2)',
    nullable: true,
  })
  peso: number | null = null;

  @ManyToOne(() => EjercicioRealizado, {
    fieldName: 'ejercicio_realizado_id',
    deleteRule: 'cascade',
  })
  ejercicioRealizado!: Rel<EjercicioRealizado>;

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
