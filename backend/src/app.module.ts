// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SkillsModule } from './skills/skills.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { TeamsModule } from './teams/teams.module'; // <-- Ensure this import exists and is correct

// import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // ConfigModule.forRoot({ isGlobal: true }), // Optional
    PrismaModule,
    AuthModule,
    SkillsModule,
    CategoriesModule,
    TagsModule,
    TeamsModule, // <-- Ensure it's listed here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}