/**
 * Convierte un texto en un patrón `ilike` sin comodines.
 *
 * El nombre del catálogo se busca sin distinguir mayúsculas (`RN-36`) y sin que
 * un `%` o un `_` del valor se interprete como comodín. PostgreSQL usa la barra
 * invertida como carácter de escape por defecto.
 */
export function patronSinComodines(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}
