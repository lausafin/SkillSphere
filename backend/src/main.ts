// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Global Middleware & Pipes ---

  // Enable CORS (Cross-Origin Resource Sharing) - adjust origin as needed for security
  app.enableCors({
    // origin: 'http://localhost:5173', // Allow your frontend origin in production
    origin: true, // Allow all origins during development (be careful in production)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global validation using class-validator DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips properties not defined in the DTO
    forbidNonWhitelisted: true, // Throws an error if extra properties are present
    transform: true, // Automatically transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Allows basic type conversion (e.g., string query param to number)
    },
  }));

  // Define the port - use environment variable or default
  const port = process.env.PORT || 3000;

  // Start listening for connections
  await app.listen(port);
  console.log(`🚀 Skill Sphere Backend is running on: http://localhost:${port}`);
}
bootstrap();