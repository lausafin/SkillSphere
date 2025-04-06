// backend/src/app.controller.ts
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // Root path or a specific prefix if desired
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get() // Keep existing root GET if you have one
  getHello(): string {
    return this.appService.getHello();
  }

  // --- NEW Keep-Alive Endpoint ---
  @Get('health') // Or '/ping', '/keep-alive', etc.
  @HttpCode(HttpStatus.OK) // Explicitly set OK status
  getHealthStatus() {
    // No complex logic needed, just confirm the server is responsive
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
  // --- End Keep-Alive Endpoint ---
}