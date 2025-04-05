import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
// import { ConfigModule, ConfigService } from '@nestjs/config'; // If using ConfigModule

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      // imports: [ConfigModule], // Import if using ConfigService
      // useFactory: async (configService: ConfigService) => ({
      //   secret: configService.get<string>('JWT_SECRET'),
      //   signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' },
      // }),
      // inject: [ConfigService],
      // --- OR --- Simple version using process.env:
       useFactory: async () => ({
         secret: process.env.JWT_SECRET || 'DEFAULT_VERY_SECRET_KEY_CHANGE_ME', // !! USE ENV !!
         signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }, // Use env or default
       }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // Provide JwtStrategy so AuthGuard can use it
  exports: [AuthService, JwtModule], // Export if needed elsewhere
})
export class AuthModule {}