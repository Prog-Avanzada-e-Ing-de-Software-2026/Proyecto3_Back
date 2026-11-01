import type { INestApplicationContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { runSeed, UnknownSeedError } from './registry.js';

const app = {} as INestApplicationContext;

describe('runSeed', () => {
  it('[seeder] ejecuta el seed registrado con el nombre recibido', async () => {
    const ejecutados: string[] = [];
    const seeders = { demo: async () => void ejecutados.push('demo') };

    await runSeed('demo', app, seeders);

    expect(ejecutados).toEqual(['demo']);
  });

  it('[seeder] rechaza un nombre desconocido y lista los disponibles', async () => {
    const seeders = { demo: async () => undefined, otro: async () => undefined };

    await expect(runSeed('inexistente', app, seeders)).rejects.toThrow(UnknownSeedError);
    await expect(runSeed('inexistente', app, seeders)).rejects.toThrow(
      'El seed "inexistente" no existe. Disponibles: demo, otro.',
    );
  });

  it('[seeder] no ejecuta ningún seed cuando el nombre no existe', async () => {
    let ejecutado = false;
    const seeders = { demo: async () => void (ejecutado = true) };

    await expect(runSeed('otro', app, seeders)).rejects.toThrow(UnknownSeedError);

    expect(ejecutado).toBe(false);
  });

  it('[seeder] avisa cuando todavía no hay seeds registrados', async () => {
    await expect(runSeed('admin', app, {})).rejects.toThrow(
      'No hay seeds registrados; "admin" no existe.',
    );
  });
});
