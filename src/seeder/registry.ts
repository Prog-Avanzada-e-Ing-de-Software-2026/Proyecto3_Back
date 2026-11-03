import type { INestApplicationContext } from '@nestjs/common';
import { runCatalogoIdentidad } from './catalogo-identidad.seed.js';

/**
 * Un seed recibe el contexto de Nest ya inicializado y ejecuta un caso de uso.
 *
 * La lógica de negocio vive en el módulo dueño del agregado: acá solo se
 * resuelve qué caso de uso correr.
 */
export type SeedRunner = (app: INestApplicationContext) => Promise<void>;

/** Seeds disponibles, indexados por el nombre que recibe `yarn db:seed <nombre>`. */
export const SEEDERS: Readonly<Record<string, SeedRunner>> = {
  'catalogo-identidad': runCatalogoIdentidad,
};

export class UnknownSeedError extends Error {
  constructor(
    readonly seedName: string,
    readonly availableSeeds: string[],
  ) {
    super(
      availableSeeds.length === 0
        ? `No hay seeds registrados; "${seedName}" no existe.`
        : `El seed "${seedName}" no existe. Disponibles: ${availableSeeds.join(', ')}.`,
    );
    this.name = 'UnknownSeedError';
  }
}

export async function runSeed(
  name: string,
  app: INestApplicationContext,
  seeders: Readonly<Record<string, SeedRunner>> = SEEDERS,
): Promise<void> {
  const runner = seeders[name];

  if (runner === undefined) {
    throw new UnknownSeedError(name, Object.keys(seeders).sort());
  }

  await runner(app);
}
