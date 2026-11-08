import { Migration } from '@mikro-orm/migrations';

export class Migration20261104110000 extends Migration {
  override name = 'Migration20261104110000';

  override up(): void | Promise<void> {
    this.addSql(`alter table "rol" drop constraint "rol_codigo_unique";`);
    this.addSql(`alter table "rol" drop column "codigo";`);
    this.addSql(`alter table "rol" add constraint "rol_nombre_unique" unique ("nombre");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "rol" drop constraint "rol_nombre_unique";`);
    this.addSql(`alter table "rol" add column "codigo" text null;`);
    this.addSql(`update "rol" set "codigo" = upper(replace("nombre", ' ', '_'));`);
    this.addSql(`alter table "rol" alter column "codigo" set not null;`);
    this.addSql(`alter table "rol" add constraint "rol_codigo_unique" unique ("codigo");`);
  }
}
