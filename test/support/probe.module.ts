import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import type { DestinationStream } from 'pino';
import { GlobalExceptionFilter } from '../../src/common/presentation/global-exception.filter.js';
import { buildPinoHttpOptions } from '../../src/common/presentation/logging/pino-options.js';
import { ProbeController } from './probe.controller.js';

/**
 * Módulo de pruebas con la misma configuración de logging y el mismo filtro
 * que `AppModule`, pero sin `MikroOrmModule.forRoot`: el fundamento HTTP no
 * depende de la base de datos.
 */
export function crearProbeModule(destino: DestinationStream): new () => object {
  @Module({
    imports: [LoggerModule.forRoot({ pinoHttp: [buildPinoHttpOptions(), destino] } as Params)],
    controllers: [ProbeController],
    providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
  })
  class ProbeModule {}

  return ProbeModule;
}

export function crearDestinoEnMemoria(): { lineas: string[]; stream: DestinationStream } {
  const lineas: string[] = [];

  return { lineas, stream: { write: (linea: string) => void lineas.push(linea) } };
}
