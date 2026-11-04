import { Controller, Get } from '@nestjs/common';
import { ErrorSemantico } from '../../src/common/domain/errors/error-semantico.js';

/**
 * Rutas de sonda exclusivas de pruebas: no forman parte de la API. Cada una
 * provoca un origen de fallo distinto para ejercitar el filtro global.
 */
@Controller('probe')
export class ProbeController {
  @Get('ok')
  ok(): { ok: boolean } {
    return { ok: true };
  }

  @Get('no-encontrado')
  noEncontrado(): never {
    throw new ErrorSemantico('no_encontrado', 'RECURSO_NO_ENCONTRADO', 'El recurso no existe.');
  }

  @Get('conflicto')
  conflicto(): never {
    throw new ErrorSemantico('conflicto', 'ESTADO_EN_CONFLICTO', 'La operación entra en conflicto.');
  }

  @Get('no-autenticado')
  noAutenticado(): never {
    throw new ErrorSemantico('no_autenticado', 'SIN_CREDENCIALES', 'No autenticado.');
  }

  @Get('prohibido')
  prohibido(): never {
    throw new ErrorSemantico('prohibido', 'SIN_PERMISO', 'No autorizado.');
  }

  @Get('entrada-invalida')
  entradaInvalida(): never {
    throw new ErrorSemantico('entrada_invalida', 'DATOS_INVALIDOS', 'Los datos no son válidos.');
  }

  @Get('inesperado')
  inesperado(): never {
    throw new Error('select * from usuarios where documento = 30111222');
  }
}
