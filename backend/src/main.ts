// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({ origin: true, credentials: true }); // Adjust origin for production

  // Apply ValidationPipe globally
  app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Automatically remove properties without decorators
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
      transform: true, // Automatically transform payloads to DTO instances (e.g., string -> number via @Type)
      transformOptions: {
          enableImplicitConversion: true, // Allows basic primitive conversions without @Type() sometimes
      },
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend application is running on port: ${port}`);
}
bootstrap();