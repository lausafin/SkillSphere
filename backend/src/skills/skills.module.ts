import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule to use PrismaService
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService], // Export if needed
})
export class SkillsModule {}