import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppConfig, AppModule } from '@mod/app';
import { NestFactory } from '@nestjs/core';
import { clusterize } from '@util/clustering';
import { initialize } from '@util/helper';
import { setupSwagger } from '@util/swagger';

const { CLUSTERING, PORT } = process.env;

const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    AppConfig.getFastifyInstance(),
    { bufferLogs: true }
  );

  initialize(app);

  await setupSwagger(app);

  // By default, Fastify only listens localhost, so we should specify '0.0.0.0'
  await app.listen(PORT, '0.0.0.0');

  console.info(`server running on ${await app.getUrl()}`);

  return app;

};

if (CLUSTERING === 'true') clusterize(bootstrap);
else bootstrap();
