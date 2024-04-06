import type { ConfigModuleOptions } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Params } from 'nestjs-pino';

import { RequestMethod } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { LogLevel, NodeEnv } from '@share/enums';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import {TypeOrmModuleOptions} from "@nestjs/typeorm";
import {SnakeNamingStrategy} from "@/snake-naming.strategy";

export class AppConfig {
  public static getFastifyInstance(): FastifyAdapter {
    return new FastifyAdapter();
  }

  public static getInitConifg(): ConfigModuleOptions {
    const validLogLevelList = Object.keys(LogLevel).map((key) => LogLevel[key]);
    const validNodeEnvList = Object.keys(NodeEnv).map((key) => NodeEnv[key]);

    return {
      isGlobal: true,
      validationSchema: Joi.object(<
        { [P in keyof NodeJS.ProcessEnv]: Joi.SchemaInternals }
      >{
        BASE_PATH: Joi.string().allow('').optional(),
        CLUSTERING: Joi.boolean().required(),
        LOG_LEVEL: Joi.string()
          .allow('')
          .valid(...validLogLevelList)
          .optional(),
        NODE_ENV: Joi.string()
          .valid(...validNodeEnvList)
          .required(),
        PORT: Joi.number().min(1).max(65535).required(),
      }),
    };
  }

  public static typeOrmConfig(): TypeOrmModuleOptions {
    const { MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME,
      MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_CHARSET, MYSQL_COLLATION } = process.env;

    let entities = [__dirname + '/../../modules/**/*.entity{.ts,.js}'];
    let migrations = [__dirname + '/../../migrations/*{.ts,.js}'];

    if ((module as any).hot) {
      const entityContext = (require as any).context(
          './../../modules',
          true,
          /\.entity\.ts$/,
      );
      entities = entityContext.keys().map(id => {
        const entityModule = entityContext(id);
        const [entity] = Object.values(entityModule);
        return entity;
      });
      const migrationContext = (require as any).context(
          './../../migrations',
          false,
          /\.ts$/,
      );
      migrations = migrationContext.keys().map(id => {
        const migrationModule = migrationContext(id);
        const [migration] = Object.values(migrationModule);
        return migration;
      });
    }

    return {
      entities,
      migrations,
      keepConnectionAlive: true,
      type: 'mysql',
      host: MYSQL_HOST,
      port: parseInt(MYSQL_PORT),
      username: MYSQL_USERNAME,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      migrationsRun: true,
      synchronize: true,
      // logging: this.nodeEnv === 'development',,
      logging: false,
      // charset: 'utf8mb4',
      // collation: 'utf8mb4_unicode_ci',
      namingStrategy: new SnakeNamingStrategy(),
      extra: {
        charset: 'utf8mb4_unicode_ci'
      }
    };

  }

  public static getLoggerConfig(): Params {
    const { BASE_PATH, CLUSTERING, LOG_LEVEL, NODE_ENV } = process.env;

    return {
      // Exclude may not work for e2e testing
      exclude: [
        {
          method: RequestMethod.ALL,
          path: `${BASE_PATH}/${AppController.prototype.healthz.name}`,
        },
      ],
      pinoHttp: {
        autoLogging: true,
        base: CLUSTERING === 'true' ? { pid: process.pid } : {},
        customAttributeKeys: {
          responseTime: 'timeSpent',
        },
        formatters: { level: (level) => ({ level }) },
        level:
          LOG_LEVEL ||
          (NODE_ENV === NodeEnv.PRODUCTION ? LogLevel.INFO : LogLevel.TRACE),
        serializers: {
          req(request: IncomingMessage) {
            return {
              method: request.method,
              url: request.url,
              // Including the headers in the log could be in violation of privacy laws, e.g. GDPR.
              // headers: request.headers,
            };
          },
          res(reply: ServerResponse) {
            return {
              statusCode: reply.statusCode,
            };
          },
        },
        transport:
          NODE_ENV !== NodeEnv.PRODUCTION
            ? {
                options: {
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                },
                target: 'pino-pretty',
              }
            : null,
      },
    };
  }
}
