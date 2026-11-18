/**
 * Un campo que no pasó la validación de entrada.
 *
 * `campo` es la ruta que declara el DTO —un DTO anidado se compone con puntos— y
 * `mensaje` es el texto en español declarado en el decorador que falló.
 */
export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}
