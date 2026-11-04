/**
 * Categorías de fallo que el dominio y la aplicación pueden expresar sin
 * conocer HTTP. La traducción a estados de respuesta vive en `presentation/`.
 */
export const CATEGORIAS_ERROR = [
  'no_encontrado',
  'conflicto',
  'no_autenticado',
  'prohibido',
  'entrada_invalida',
  'inesperado',
] as const;

export type CategoriaError = (typeof CATEGORIAS_ERROR)[number];

/**
 * Fallo semántico de dominio o aplicación.
 *
 * El código es estable y forma parte del contrato con el cliente; el mensaje
 * es seguro de exponer y nunca incluye detalles técnicos. Las reglas concretas
 * del gimnasio se expresan con subclases con nombre propio cuando la regla
 * existe, no antes.
 */
export class ErrorSemantico extends Error {
  readonly categoria: CategoriaError;
  readonly codigo: string;

  constructor(categoria: CategoriaError, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorSemantico';
    this.categoria = categoria;
    this.codigo = codigo;
  }
}
