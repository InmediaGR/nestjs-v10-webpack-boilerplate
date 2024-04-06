import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppConfig, AppModule } from '@mod/app';
import { NestFactory } from '@nestjs/core';
import { clusterize } from '@util/clustering';
import { initialize } from '@util/helper';
import { setupSwagger } from '@util/swagger';
import { DataSource } from 'typeorm';
import { SharedModule } from '@share/shared.module';
import {ApiConfigService} from "@share/services/api-config.service";
// import { ConfigService } from '@nestjs/config';


const { CLUSTERING, PORT } = process.env;

const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    AppConfig.getFastifyInstance(),
    { bufferLogs: true }
  );

  initialize(app);

  // const configService = app.select(SharedModule).get(ApiConfigService);
  // const configService = app.select(ApiConfigService).get(ApiConfigService);

  const configService = app.get(ApiConfigService);
  // console.info('Confssssssssssssss', configService);

  await setupSwagger(app);

  // const dataSource = app.get(DataSource);
  // await AppModule.initialize(dataSource);

  // By default, Fastify only listens localhost, so we should specify '0.0.0.0'
  await app.listen(PORT, '0.0.0.0');

  console.info(`server running on ${await app.getUrl()}`);

  return app;

};

if (CLUSTERING === 'true') clusterize(bootstrap);
else bootstrap();
