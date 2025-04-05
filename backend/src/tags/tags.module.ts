// src/tags/tags.module.ts
import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule to make PrismaService available
  controllers: [TagsController], // Register the controller
  providers: [TagsService], // Register the service
  exports: [TagsService], // Export service if it needs to be used directly by other modules (e.g., potentially by SkillsService, though not strictly needed with current design)
})
export class TagsModule {}