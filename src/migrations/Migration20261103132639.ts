import { Migration } from '@mikro-orm/migrations';

const TABLAS_CON_AUDITORIA = ['permiso', 'rol', 'usuario', 'profesor', 'alumno'] as const;

export class Migration20261103132639 extends Migration {

  override name = 'Migration20261103132639';

  override up(): void | Promise<void> {
    this.addSql(`create table "permiso" ("id" serial primary key, "codigo" text not null, "nombre" text not null, "descripcion" text null, "created_at" timestamptz not null, "created_by_id" integer null, "updated_at" timestamptz null, "updated_by_id" integer null, "deleted_at" timestamptz null, "deleted_by_id" integer null);`);
    this.addSql(`alter table "permiso" add constraint "permiso_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "rol" ("id" serial primary key, "codigo" text not null, "nombre" text not null, "descripcion" text null, "created_at" timestamptz not null, "created_by_id" integer null, "updated_at" timestamptz null, "updated_by_id" integer null, "deleted_at" timestamptz null, "deleted_by_id" integer null);`);
    this.addSql(`alter table "rol" add constraint "rol_codigo_unique" unique ("codigo");`);

    this.addSql(`create table "rol_permiso" ("rol_id" int not null, "permiso_id" int not null, primary key ("rol_id", "permiso_id"));`);

    this.addSql(`create table "usuario" ("id" serial primary key, "email" text not null, "password_hash" text not null, "rol_id" int not null, "created_at" timestamptz not null, "created_by_id" integer null, "updated_at" timestamptz null, "updated_by_id" integer null, "deleted_at" timestamptz null, "deleted_by_id" integer null);`);
    this.addSql(`alter table "usuario" add constraint "usuario_email_unique" unique ("email");`);

    this.addSql(`create table "profesor" ("id" serial primary key, "nombre" text not null, "fecha_nacimiento" date not null, "numero_documento" text not null, "numero_telefono" text not null, "fecha_ingreso" timestamptz not null, "usuario_id" int not null, "created_at" timestamptz not null, "created_by_id" integer null, "updated_at" timestamptz null, "updated_by_id" integer null, "deleted_at" timestamptz null, "deleted_by_id" integer null);`);
    this.addSql(`alter table "profesor" add constraint "profesor_numero_documento_unique" unique ("numero_documento");`);
    this.addSql(`alter table "profesor" add constraint "profesor_usuario_id_unique" unique ("usuario_id");`);

    this.addSql(`create table "alumno" ("id" serial primary key, "nombre" text not null, "fecha_nacimiento" date not null, "numero_documento" text not null, "numero_telefono" text not null, "fecha_ingreso" timestamptz not null, "observaciones" text null, "profesor_asignado_id" int null, "usuario_id" int not null, "created_at" timestamptz not null, "created_by_id" integer null, "updated_at" timestamptz null, "updated_by_id" integer null, "deleted_at" timestamptz null, "deleted_by_id" integer null);`);
    this.addSql(`alter table "alumno" add constraint "alumno_numero_documento_unique" unique ("numero_documento");`);
    this.addSql(`alter table "alumno" add constraint "alumno_usuario_id_unique" unique ("usuario_id");`);

    this.addSql(`alter table "rol_permiso" add constraint "rol_permiso_rol_id_foreign" foreign key ("rol_id") references "rol" ("id") on update cascade on delete restrict;`);
    this.addSql(`alter table "rol_permiso" add constraint "rol_permiso_permiso_id_foreign" foreign key ("permiso_id") references "permiso" ("id") on update cascade on delete restrict;`);

    this.addSql(`alter table "usuario" add constraint "usuario_rol_id_foreign" foreign key ("rol_id") references "rol" ("id") on delete restrict;`);

    this.addSql(`alter table "profesor" add constraint "profesor_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on delete restrict;`);

    this.addSql(`alter table "alumno" add constraint "alumno_profesor_asignado_id_foreign" foreign key ("profesor_asignado_id") references "profesor" ("id") on delete restrict;`);
    this.addSql(`alter table "alumno" add constraint "alumno_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on delete restrict;`);

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
    for (const tabla of ['alumno', 'profesor', 'rol_permiso', 'usuario', 'rol', 'permiso'] as const) {
      this.addSql(`drop table if exists "${tabla}" cascade;`);
    }
  }
}
