import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(PinoLogger));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Gym MVP API')
      .setDescription('Backend de gestión de un gimnasio: planes, entrenamientos y seguimiento.')
      .build(),
  );

  SwaggerModule.setup('api/docs', app, documento);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
