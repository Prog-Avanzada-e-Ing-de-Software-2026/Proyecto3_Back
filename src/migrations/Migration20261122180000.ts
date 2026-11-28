import { Migration } from '@mikro-orm/migrations';

/**
 * Tablas de los agregados Plan y Entrenamiento y del catálogo de ejercicios,
 * más los índices que sostienen sus búsquedas y filtros.
 *
 * Los índices cubren el historial y el solapamiento de planes por alumno y
 * fechas, el historial y las asistencias por alumno y fecha, el récord y la
 * evolución por ejercicio, el filtro por categoría y la comprobación de "en
 * uso" del catálogo.
 */
const TABLAS_CON_AUDITORIA = [
  'objetivo_plan',
  'material',
  'unidad',
  'categoria_ejercicio',
  'ejercicio',
  'plan',
  'prescripcion_semanal',
  'dia_del_plan',
  'ejercicio_planificado',
  'entrenamiento',
  'ejercicio_realizado',
  'serie',
] as const;

const COLUMNAS_DE_AUDITORIA =
  '"created_at" timestamptz not null, "created_by_id" integer null, "updated_at" timestamptz null, "updated_by_id" integer null, "deleted_at" timestamptz null, "deleted_by_id" integer null';

export class Migration20261122180000 extends Migration {
  override name = 'Migration20261122180000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "objetivo_plan" ("id" serial primary key, "nombre" text not null, "descripcion" text null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create unique index "objetivo_plan_nombre_lower_unique" on "objetivo_plan" (lower("nombre"));`,
    );

    this.addSql(
      `create table "material" ("id" serial primary key, "nombre" text not null, "descripcion" text null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create unique index "material_nombre_lower_unique" on "material" (lower("nombre"));`,
    );

    this.addSql(
      `create table "unidad" ("id" serial primary key, "nombre" text not null, "descripcion" text null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(`create unique index "unidad_nombre_lower_unique" on "unidad" (lower("nombre"));`);

    this.addSql(
      `create table "categoria_ejercicio" ("id" serial primary key, "nombre" text not null, "descripcion" text null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create unique index "categoria_ejercicio_nombre_lower_unique" on "categoria_ejercicio" (lower("nombre"));`,
    );

    this.addSql(
      `create table "ejercicio" ("id" serial primary key, "nombre" text not null, "categoria_id" int not null, "material_id" int null, "unidad_id" int not null, "descripcion" text null, "foto" text null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create unique index "ejercicio_nombre_lower_unique" on "ejercicio" (lower("nombre"));`,
    );
    this.addSql(`create index "ejercicio_categoria_id_index" on "ejercicio" ("categoria_id");`);
    this.addSql(`create index "ejercicio_material_id_index" on "ejercicio" ("material_id");`);
    this.addSql(`create index "ejercicio_unidad_id_index" on "ejercicio" ("unidad_id");`);

    this.addSql(
      `create table "plan" ("id" serial primary key, "fecha_desde" date not null, "fecha_hasta" date not null, "numero_plan" int not null, "fecha_registro" timestamptz not null, "alumno_id" int not null, "profesor_id" int not null, "objetivo_id" int not null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create index "plan_alumno_numero_index" on "plan" ("alumno_id", "numero_plan");`,
    );
    this.addSql(
      `create index "plan_alumno_fecha_desde_index" on "plan" ("alumno_id", "fecha_desde");`,
    );
    this.addSql(`create index "plan_profesor_id_index" on "plan" ("profesor_id");`);
    this.addSql(`create index "plan_objetivo_id_index" on "plan" ("objetivo_id");`);

    this.addSql(
      `create table "prescripcion_semanal" ("id" serial primary key, "series" int not null, "cantidad_objetivo" int not null, "rir" int null, "segundos_de_descanso" int null, "nro_semana" int not null, "plan_id" int not null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `alter table "prescripcion_semanal" add constraint "prescripcion_semanal_plan_semana_unique" unique ("plan_id", "nro_semana");`,
    );

    this.addSql(
      `create table "dia_del_plan" ("id" serial primary key, "orden" int not null, "plan_id" int not null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create index "dia_del_plan_plan_orden_index" on "dia_del_plan" ("plan_id", "orden");`,
    );

    this.addSql(
      `create table "ejercicio_planificado" ("id" serial primary key, "orden" int not null, "bloque" text not null, "ejercicio_id" int not null, "plan_id" int null, "dia_del_plan_id" int null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create index "ejercicio_planificado_plan_bloque_index" on "ejercicio_planificado" ("plan_id", "bloque");`,
    );
    this.addSql(
      `create index "ejercicio_planificado_dia_del_plan_index" on "ejercicio_planificado" ("dia_del_plan_id");`,
    );
    this.addSql(
      `create index "ejercicio_planificado_ejercicio_index" on "ejercicio_planificado" ("ejercicio_id");`,
    );
    this.addSql(
      `alter table "ejercicio_planificado" add constraint "ejercicio_planificado_bloque_check" check ("bloque" in ('movilidad', 'core', 'fuerza'));`,
    );
    this.addSql(
      `alter table "ejercicio_planificado" add constraint "ejercicio_planificado_bloque_padre_check" check (("plan_id" is null) <> ("dia_del_plan_id" is null));`,
    );

    this.addSql(
      `create table "entrenamiento" ("id" serial primary key, "fecha" timestamptz not null, "nro_semana" int not null, "nro_dia_plan" int not null, "comentario" text null, "alumno_id" int not null, "plan_id" int not null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `create index "entrenamiento_alumno_fecha_index" on "entrenamiento" ("alumno_id", "fecha");`,
    );
    this.addSql(`create index "entrenamiento_plan_id_index" on "entrenamiento" ("plan_id");`);

    this.addSql(
      `create table "ejercicio_realizado" ("id" serial primary key, "ejercicio_id" int not null, "entrenamiento_id" int not null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(
      `alter table "ejercicio_realizado" add constraint "ejercicio_realizado_entrenamiento_ejercicio_unique" unique ("entrenamiento_id", "ejercicio_id");`,
    );
    this.addSql(
      `create index "ejercicio_realizado_ejercicio_index" on "ejercicio_realizado" ("ejercicio_id");`,
    );

    this.addSql(
      `create table "serie" ("id" serial primary key, "cantidad" int not null, "peso" numeric(6,2) null, "ejercicio_realizado_id" int not null, ${COLUMNAS_DE_AUDITORIA});`,
    );
    this.addSql(`create index "serie_ejercicio_realizado_index" on "serie" ("ejercicio_realizado_id");`);

    this.addSql(
      `create index "alumno_profesor_asignado_index" on "alumno" ("profesor_asignado_id");`,
    );

    this.addSql(
      `alter table "ejercicio" add constraint "ejercicio_categoria_id_foreign" foreign key ("categoria_id") references "categoria_ejercicio" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "ejercicio" add constraint "ejercicio_material_id_foreign" foreign key ("material_id") references "material" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "ejercicio" add constraint "ejercicio_unidad_id_foreign" foreign key ("unidad_id") references "unidad" ("id") on delete restrict;`,
    );

    this.addSql(
      `alter table "plan" add constraint "plan_alumno_id_foreign" foreign key ("alumno_id") references "alumno" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "plan" add constraint "plan_profesor_id_foreign" foreign key ("profesor_id") references "profesor" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "plan" add constraint "plan_objetivo_id_foreign" foreign key ("objetivo_id") references "objetivo_plan" ("id") on delete restrict;`,
    );

    this.addSql(
      `alter table "prescripcion_semanal" add constraint "prescripcion_semanal_plan_id_foreign" foreign key ("plan_id") references "plan" ("id") on delete cascade;`,
    );

    this.addSql(
      `alter table "dia_del_plan" add constraint "dia_del_plan_plan_id_foreign" foreign key ("plan_id") references "plan" ("id") on delete cascade;`,
    );

    this.addSql(
      `alter table "ejercicio_planificado" add constraint "ejercicio_planificado_ejercicio_id_foreign" foreign key ("ejercicio_id") references "ejercicio" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "ejercicio_planificado" add constraint "ejercicio_planificado_plan_id_foreign" foreign key ("plan_id") references "plan" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "ejercicio_planificado" add constraint "ejercicio_planificado_dia_del_plan_id_foreign" foreign key ("dia_del_plan_id") references "dia_del_plan" ("id") on delete cascade;`,
    );

    this.addSql(
      `alter table "entrenamiento" add constraint "entrenamiento_alumno_id_foreign" foreign key ("alumno_id") references "alumno" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "entrenamiento" add constraint "entrenamiento_plan_id_foreign" foreign key ("plan_id") references "plan" ("id") on delete restrict;`,
    );

    this.addSql(
      `alter table "ejercicio_realizado" add constraint "ejercicio_realizado_ejercicio_id_foreign" foreign key ("ejercicio_id") references "ejercicio" ("id") on delete restrict;`,
    );
    this.addSql(
      `alter table "ejercicio_realizado" add constraint "ejercicio_realizado_entrenamiento_id_foreign" foreign key ("entrenamiento_id") references "entrenamiento" ("id") on delete cascade;`,
    );

    this.addSql(
      `alter table "serie" add constraint "serie_ejercicio_realizado_id_foreign" foreign key ("ejercicio_realizado_id") references "ejercicio_realizado" ("id") on delete cascade;`,
    );

    for (const tabla of TABLAS_CON_AUDITORIA) {
      for (const columna of ['created_by_id', 'updated_by_id', 'deleted_by_id'] as const) {
        this.addSql(
          `alter table "${tabla}" add constraint "${tabla}_${columna}_foreign" foreign key ("${columna}") references "usuario" ("id") on delete restrict;`,
        );
      }

      this.addSql(
        `alter table "${tabla}" add constraint "${tabla}_baja_coherente_check" check ((deleted_at is null) = (deleted_by_id is null));`,
      );
      this.addSql(
        `alter table "${tabla}" add constraint "${tabla}_edicion_coherente_check" check ((updated_at is null) = (updated_by_id is null));`,
      );
    }
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "alumno_profesor_asignado_index";`);

    for (const tabla of [
      'serie',
      'ejercicio_realizado',
      'entrenamiento',
      'ejercicio_planificado',
      'dia_del_plan',
      'prescripcion_semanal',
      'plan',
      'ejercicio',
      'categoria_ejercicio',
      'unidad',
      'material',
      'objetivo_plan',
    ] as const) {
      this.addSql(`drop table if exists "${tabla}" cascade;`);
    }
  }
}
