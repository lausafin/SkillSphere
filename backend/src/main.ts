// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// --- ADD SWAGGER IMPORTS ---
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  // app.useGlobalPipes(new ValidationPipe({ /* ... */ }));

  // --- ADD SWAGGER SETUP ---
  const config = new DocumentBuilder()
    .setTitle('SkillSphere API')
    .setDescription('API documentation for the SkillSphere application')
    .setVersion('1.0')
    // .addTag('skills') // Add tags for controllers if desired
    // .addTag('auth')
    // .addTag('teams')
    .addBearerAuth() // If using Bearer token (JWT) auth
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Choose the path for your API docs UI (e.g., /api-docs)
  SwaggerModule.setup('api-docs', app, document);
  // --- END SWAGGER SETUP ---


  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend application running on: ${await app.getUrl()}`);
  // Log Swagger UI path
  console.log(`Swagger UI available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();