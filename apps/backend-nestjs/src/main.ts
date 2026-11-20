/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app/app.module';

const dbDir = join(process.cwd(), 'dist', 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Photo Gallery API')
    .setDescription(
      'Canonical HTTP API contract for the Photo Gallery backend. ' +
        'All alternative backend implementations (Spring Boot, FastAPI, Gin) ' +
        'must conform to this contract.',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:42621', 'Local dev server')
    .addTag('photos', 'Photo upload, retrieval, and management')
    .build();
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'dist/uploads'), {
    prefix: '/uploads/',
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('NESTJS_BACKEND_PORT');
  await app.listen(port ?? 3000);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📖 Swagger UI available at: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
