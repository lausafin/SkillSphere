// backend/src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    // This is the default response from the root endpoint
    return 'Hello World! Welcome to Skill Sphere API.';
  }
}