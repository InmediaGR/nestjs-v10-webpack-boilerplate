import type { ValidationError } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  AllExceptionFilter,
  NormalExceptionFilter,
  ValidationExceptionFilter,
} from '@/filter';
import { ResponseInterceptor } from '@/interceptor/response.interceptor';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { AppConfig } from './app.config';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { SharedModule } from '@/shared/shared.module';
import {TypeOrmModule, TypeOrmModuleOptions} from "@nestjs/typeorm";
import {addTransactionalDataSource} from "typeorm-transactional";


@Module({
  controllers: [AppController],
  imports: [
    SharedModule,
    // Allow to access .env file and validate env variables
    ConfigModule.forRoot(AppConfig.getInitConifg()),
    // Logger framework that better then NestJS default logger
    LoggerModule.forRoot(AppConfig.getLoggerConfig()),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) => {
        return configService.typeOrmConfig;
      },
      inject: [
        ApiConfigService
      ],
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    // TypeOrmModule.forRoot({
    //   // TypeORM configuration options go here
    //   type: 'mysql',
    //   host: '127.0.0.1',
    //   port: 3306,
    //   username: 'root',
    //   password: 'Topikinos2001',
    //   database: 'nest-fast',
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   migrationsRun: true,
    //   synchronize: true,
    //   extra: {
    //     charset: 'utf8mb4_unicode_ci'
    //   },
    //   // driver: 'mysql2'
    // }),

  ],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_FILTER, useClass: NormalExceptionFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
    {
      /**
       * Allowing to do validation through DTO
       * since class-validator library default throw BadRequestException, here we use exceptionFactory to throw
       * their internal exception so that filter can recognize it
       */
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          exceptionFactory: (errors: ValidationError[]) => {
            return errors[0];
          },
        }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})

export class AppModule {

  private static dataSource: DataSource;

  static async initialize(dataSource: DataSource) {
    AppModule.dataSource = dataSource;
  }

  static getDataSource(): Promise<DataSource> {
    return Promise.resolve(AppModule.dataSource);
  }


}
