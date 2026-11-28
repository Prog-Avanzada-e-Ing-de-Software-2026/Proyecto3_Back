import { Migration } from '@mikro-orm/migrations';

/**
 * Extensión que normaliza los diacríticos de la búsqueda por coincidencia
 * parcial. La condición la aplica en la columna y en el patrón.
 */
export class Migration20261127120000 extends Migration {
  override name = 'Migration20261127120000';

  override up(): void | Promise<void> {
    this.addSql(`create extension if not exists "unaccent";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop extension if exists "unaccent";`);
  }
}
