import { ErrorSemantico } from './errors/error-semantico.js';

/**
 * Validaciones compartidas por las entidades auditadas del modelo.
 *
 * No son una base abstracta ni completan columnas: cada entidad declara sus
 * seis columnas de auditoría y llama a estas funciones para rechazar valores
 * inválidos con el mismo criterio.
 */

export function normalizarTextoObligatorio(valor: string | null | undefined, campo: string): string {
  const normalizado = typeof valor === 'string' ? valor.trim() : '';

  if (normalizado.length === 0) {
    throw new ErrorSemantico('entrada_invalida', `${campo}_VACIO`, `El campo ${campo} es obligatorio.`);
  }

  return normalizado;
}

export function normalizarEmail(valor: string | null | undefined): string {
  return normalizarTextoObligatorio(valor, 'EMAIL').toLowerCase();
}

export function normalizarCodigo(valor: string | null | undefined): string {
  return normalizarTextoObligatorio(valor, 'CODIGO').toUpperCase();
}

export function exigirActor(actorId: number | null | undefined): number {
  if (typeof actorId !== 'number' || !Number.isInteger(actorId) || actorId <= 0) {
    throw new ErrorSemantico(
      'entrada_invalida',
      'ACTOR_REQUERIDO',
      'La operación requiere un actor identificado.',
    );
  }

  return actorId;
}

export function exigirMomento(momento: Date | null | undefined): Date {
  if (!(momento instanceof Date) || Number.isNaN(momento.getTime())) {
    throw new ErrorSemantico(
      'entrada_invalida',
      'MOMENTO_INVALIDO',
      'La operación requiere un momento válido.',
    );
  }

  return momento;
}

/**
 * Valida una fecha de calendario en formato `YYYY-MM-DD`.
 *
 * Se representa como cadena para no reintroducir zona horaria: una fecha de
 * nacimiento no es un instante.
 */
export function exigirFechaCalendario(valor: string | null | undefined, campo: string): string {
  const normalizado = normalizarTextoObligatorio(valor, campo);
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizado);

  if (coincidencia === null) {
    throw new ErrorSemantico(
      'entrada_invalida',
      `${campo}_INVALIDA`,
      `El campo ${campo} debe tener el formato YYYY-MM-DD.`,
    );
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    throw new ErrorSemantico(
      'entrada_invalida',
      `${campo}_INVALIDA`,
      `El campo ${campo} no es una fecha de calendario válida.`,
    );
  }

  return normalizado;
}
