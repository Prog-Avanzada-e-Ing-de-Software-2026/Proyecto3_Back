import type { INestApplicationContext } from '@nestjs/common';
import { CreateUsuarioUseCase } from '../modules/auth/application/use-cases/create-usuario.use-case.js';
import { LONGITUD_MINIMA_CREDENCIAL } from '../modules/auth/domain/credencial.js';
import { NOMBRES_ROL } from '../modules/auth/domain/catalogos.js';

function exigirVariable(nombre: string): string {
  const valor = process.env[nombre]?.trim() ?? '';

  if (valor.length === 0) {
    throw new Error(`${nombre} es obligatoria para ejecutar el seed usuario-inicial.`);
  }

  return valor;
}

/**
 * Carga inicial del administrador.
 *
 * Sin este usuario la aplicación no tiene por dónde empezar: toda operación exige
 * sesión y ninguna historia de alta está implementada todavía. Es idempotente: si
 * el email ya existe, el alta lo rechaza y la carga termina sin tocar la
 * credencial existente.
 */
export async function runUsuarioInicial(app: INestApplicationContext): Promise<void> {
  const email = exigirVariable('ADMIN_INICIAL_EMAIL');
  const password = exigirVariable('ADMIN_INICIAL_PASSWORD');

  if (password.length < LONGITUD_MINIMA_CREDENCIAL) {
    throw new Error(
      `ADMIN_INICIAL_PASSWORD debe tener al menos ${LONGITUD_MINIMA_CREDENCIAL} caracteres.`,
    );
  }

  const crearUsuario = app.get(CreateUsuarioUseCase);

  try {
    await crearUsuario.execute({ email, password, rolNombre: NOMBRES_ROL.ADMINISTRADOR });
  } catch (error) {
    // El contrato del seed es «que exista», no «crearlo»: un email repetido es el
    // resultado esperado en la segunda ejecución. Cualquier otro fallo se propaga.
    if ((error as { codigo?: string }).codigo === 'USUARIO_DUPLICADO') {
      return;
    }

    throw error;
  }
}
