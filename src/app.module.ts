import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LoggerModule } from 'nestjs-pino';
import { GlobalExceptionFilter } from './common/presentation/global-exception.filter.js';
import { buildPinoHttpOptions } from './common/presentation/logging/pino-options.js';
import mikroOrmConfig from './mikro-orm.config.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: buildPinoHttpOptions() }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
