import { Migration } from '@mikro-orm/migrations';

/**
 * Unicidad del nombre del catálogo sin distinguir mayúsculas (`RN-36`).
 *
 * Un `UNIQUE` plano deja convivir «Administrador» y «administrador»; el índice
 * sobre `lower("nombre")` es la garantía real, no la lectura previa del caso de
 * uso. La baja lógica no libera el nombre, así que el índice no es parcial.
 */
export class Migration20261118120000 extends Migration {
  override name = 'Migration20261118120000';

  override up(): void | Promise<void> {
    this.addSql(`alter table "permiso" drop constraint "permiso_nombre_unique";`);
    this.addSql(`alter table "rol" drop constraint "rol_nombre_unique";`);

    this.addSql(
      `create unique index "permiso_nombre_lower_unique" on "permiso" (lower("nombre"));`,
    );
    this.addSql(`create unique index "rol_nombre_lower_unique" on "rol" (lower("nombre"));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "rol_nombre_lower_unique";`);
    this.addSql(`drop index "permiso_nombre_lower_unique";`);

    this.addSql(`alter table "rol" add constraint "rol_nombre_unique" unique ("nombre");`);
    this.addSql(`alter table "permiso" add constraint "permiso_nombre_unique" unique ("nombre");`);
  }
}
