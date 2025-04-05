import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Optional: Connect to the database when the module initializes
    await this.$connect();
    console.log('Prisma Client Connected');
  }

  async onModuleDestroy() {
    // Optional: Disconnect from the database when the application shuts down
    await this.$disconnect();
     console.log('Prisma Client Disconnected');
  }

  // Optional: Add clean-up logic for specific use cases like e2e testing
  // async cleanDatabase() { ... }
}