// backend/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // No prefix, applies to the root path
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get() // Handles GET requests to the root path '/'
  getHello(): string {
    return this.appService.getHello();
  }

  // You might add other root-level endpoints here if needed,
  // like a health check:
  // @Get('health')
  // getHealth(): { status: string } {
  //   return { status: 'ok' };
  // }
}