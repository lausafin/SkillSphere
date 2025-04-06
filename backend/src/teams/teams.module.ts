// src/teams/teams.module.ts
import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService], // Export if needed elsewhere
})
export class TeamsModule {}