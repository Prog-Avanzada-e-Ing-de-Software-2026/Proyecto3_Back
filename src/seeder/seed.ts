import { NestFactory } from '@nestjs/core';
import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from '../app.module.js';
import { runSeed, SEEDERS, UnknownSeedError } from './registry.js';

const name = process.argv[2];

if (name === undefined) {
  process.stderr.write('Uso: yarn db:seed <nombre>\n');
  process.exit(1);
}

// Se valida antes de levantar Nest: un nombre mal escrito no debe abrir la base.
if (!(name in SEEDERS)) {
  process.stderr.write(`${new UnknownSeedError(name, Object.keys(SEEDERS).sort()).message}\n`);
  process.exit(1);
}

const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
const logger = app.get(PinoLogger);

app.useLogger(logger);

try {
  // Un seed corre fuera de una petición HTTP: sin este contexto, los
  // repositorios no pueden resolver el EntityManager y el ORM rechaza
  // operar sobre la instancia global.
  const orm = app.get(MikroORM);
  await RequestContext.create(orm.em, async () => {
    await runSeed(name, app);
  });
  logger.log(`Seed "${name}" ejecutado`);
} catch (error) {
  if (error instanceof UnknownSeedError) {
    process.stderr.write(`${error.message}\n`);
  } else {
    logger.error(error, `El seed "${name}" falló`);
  }

  process.exitCode = 1;
} finally {
  await app.close();
}
