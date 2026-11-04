import { Migration } from '@mikro-orm/migrations';

export class Migration20261104100000 extends Migration {
  override name = 'Migration20261104100000';

  override up(): void | Promise<void> {
    this.addSql(`alter table "permiso" drop constraint "permiso_codigo_unique";`);
    this.addSql(`alter table "permiso" drop column "codigo";`);
    this.addSql(`alter table "permiso" add constraint "permiso_nombre_unique" unique ("nombre");`);

    this.addSql(`alter table "alumno" add column "activo" boolean not null default true;`);
    this.addSql(`update "alumno" set "activo" = ("deleted_at" is null);`);
    this.addSql(
      `alter table "alumno" add constraint "alumno_activo_coherente_check" check (("deleted_at" is null) = "activo");`,
    );

    this.addSql(`alter table "profesor" add column "activo" boolean not null default true;`);
    this.addSql(`update "profesor" set "activo" = ("deleted_at" is null);`);
    this.addSql(
      `alter table "profesor" add constraint "profesor_activo_coherente_check" check (("deleted_at" is null) = "activo");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "profesor" drop constraint "profesor_activo_coherente_check";`);
    this.addSql(`alter table "profesor" drop column "activo";`);

    this.addSql(`alter table "alumno" drop constraint "alumno_activo_coherente_check";`);
    this.addSql(`alter table "alumno" drop column "activo";`);

    this.addSql(`alter table "permiso" drop constraint "permiso_nombre_unique";`);
    this.addSql(`alter table "permiso" add column "codigo" text null;`);
    this.addSql(`update "permiso" set "codigo" = upper(replace("nombre", ' ', '_'));`);
    this.addSql(`alter table "permiso" alter column "codigo" set not null;`);
    this.addSql(`alter table "permiso" add constraint "permiso_codigo_unique" unique ("codigo");`);
  }
}
