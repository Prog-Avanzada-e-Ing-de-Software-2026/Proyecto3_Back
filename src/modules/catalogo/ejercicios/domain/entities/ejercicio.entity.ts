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
// oxlint-disable-next-line import/no-cycle -- las entidades de catálogo declaran la colección inversa.
import { CategoriaEjercicio } from '../../../../catalogo/categorias-ejercicio/domain/entities/categoria-ejercicio.entity.js';
// oxlint-disable-next-line import/no-cycle -- las entidades de catálogo declaran la colección inversa.
import { Material } from '../../../../catalogo/materiales/domain/entities/material.entity.js';
// oxlint-disable-next-line import/no-cycle -- las entidades de catálogo declaran la colección inversa.
import { Unidad } from '../../../../catalogo/unidades/domain/entities/unidad.entity.js';
// oxlint-disable-next-line import/no-cycle -- los planes y entrenamientos referencian al ejercicio del catálogo.
import { EjercicioPlanificado } from '../../../../planes/domain/entities/ejercicio-planificado.entity.js';
// oxlint-disable-next-line import/no-cycle -- los planes y entrenamientos referencian al ejercicio del catálogo.
import { EjercicioRealizado } from '../../../../entrenamientos/domain/entities/ejercicio-realizado.entity.js';

/**
 * Definición de un ejercicio del catálogo: qué se hace, con qué material y en
 * qué unidad se mide (`HU 26`, `RN-38`, `RN-39`). Raíz de un agregado de
 * catálogo propio.
 */
@Entity({ tableName: 'ejercicio' })
@Unique({
  name: 'ejercicio_nombre_lower_unique',
  expression: 'create unique index "ejercicio_nombre_lower_unique" on "ejercicio" (lower("nombre"))',
})
@Index({ name: 'ejercicio_categoria_id_index', properties: ['categoria'] })
@Index({ name: 'ejercicio_material_id_index', properties: ['material'] })
@Index({ name: 'ejercicio_unidad_id_index', properties: ['unidad'] })
export class Ejercicio {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  nombre!: string;

  @ManyToOne(() => CategoriaEjercicio, {
    fieldName: 'categoria_id',
    deleteRule: 'restrict',
  })
  categoria!: Rel<CategoriaEjercicio>;

  @ManyToOne(() => Material, {
    fieldName: 'material_id',
    nullable: true,
    deleteRule: 'restrict',
  })
  material: Rel<Material> | null = null;

  @ManyToOne(() => Unidad, {
    fieldName: 'unidad_id',
    deleteRule: 'restrict',
  })
  unidad!: Rel<Unidad>;

  @Property({ type: 'text', nullable: true })
  descripcion: string | null = null;

  @Property({ type: 'text', nullable: true })
  foto: string | null = null;

  @OneToMany(() => EjercicioPlanificado, (ejercicioPlanificado) => ejercicioPlanificado.ejercicio)
  ejerciciosPlanificados = new Collection<EjercicioPlanificado>(this);

  @OneToMany(() => EjercicioRealizado, (ejercicioRealizado) => ejercicioRealizado.ejercicio)
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
