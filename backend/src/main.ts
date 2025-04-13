// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable CORS for frontend connection
  app.enableCors({ origin: true, credentials: true });

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // Strip unknown fields
      forbidNonWhitelisted: true,   // Reject requests with unknown fields
      transform: true               // Auto-convert types (e.g. ?id=1 -> number)
    })
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SkillSphere API')
    .setDescription('API documentation for the SkillSphere application')
    .setVersion('1.0')
    .addBearerAuth() // Enable JWT token support
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Backend application running on: ${await app.getUrl()}`);
  console.log(`Swagger UI available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();
