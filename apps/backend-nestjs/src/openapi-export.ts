/**
 * Standalone script that builds the NestJS application context and writes
 * the generated OpenAPI 3 spec to docs/openapi.yaml at the workspace root.
 *
 * Run with: npm run openapi:export
 *
 * The emitted file is the canonical HTTP API contract for every alternative
 * backend implementation (Spring Boot, FastAPI, Gin).
 */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dump } from 'js-yaml';
import { join, resolve } from 'path';
import { AppModule } from './app/app.module';
import { buildSwaggerConfig } from './main';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

  const workspaceRoot = resolve(__dirname, '..', '..', '..');
  const outDir = join(workspaceRoot, 'docs');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const yamlOut = join(outDir, 'openapi.yaml');
  const jsonOut = join(outDir, 'openapi.json');

  writeFileSync(yamlOut, dump(document, { noRefs: true, lineWidth: 120 }), 'utf8');
  writeFileSync(jsonOut, JSON.stringify(document, null, 2), 'utf8');

  console.log(`✅ OpenAPI spec written to:`);
  console.log(`   - ${yamlOut}`);
  console.log(`   - ${jsonOut}`);

  await app.close();
}

exportOpenApi().catch((err) => {
  console.error('Failed to export OpenAPI spec:', err);
  process.exit(1);
});
