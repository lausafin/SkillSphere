import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SkillsModule } from './skills/skills.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module'; // Assume TagsModule exists
import { TeamsModule } from './teams/teams.module'; // Optional: If you have a TeamsModule
// import { ConfigModule } from '@nestjs/config'; // Optional: For .env handling

@Module({
  imports: [
    // Optional: Load .env variables globally
    // ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, // PrismaModule is global, but importing is fine
    AuthModule,
    SkillsModule,
    CategoriesModule,
    TagsModule, // Add TagsModule here
    TeamsModule, // Optional: If you have a TeamsModule
  ],
  controllers: [AppController], // Default controller
  providers: [AppService],     // Default service
})
export class AppModule {}