import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
// import { ConfigService } from '@nestjs/config'; // Use if ConfigModule is set up

// Define the expected shape of the JWT payload
interface JwtPayload {
  userId: number;
  email: string;
  // iat?: number; // Issued at
  // exp?: number; // Expiration time
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    // configService: ConfigService // Inject ConfigService if used
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: configService.get('JWT_SECRET'), // Get secret from config/env
      secretOrKey: process.env.JWT_SECRET || 'DEFAULT_VERY_SECRET_KEY_CHANGE_ME', // Use env variable!
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    console.log('JWT Strategy Validate - Received Payload:', JSON.stringify(payload)); // Log payload
    if (!payload || typeof payload.userId !== 'number') { // Basic check
         console.error('JWT Strategy Error: Invalid payload or userId type.');
         throw new UnauthorizedException('Invalid token payload.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    });
    console.log('JWT Strategy Validate - User Found:', user); // Log user found

    if (!user) {
       console.error('JWT Strategy Error: User not found for ID in token.');
      throw new UnauthorizedException('User not found or token invalid.');
    }
    // Return structure needed by guards/request scope
    return { userId: user.id, email: user.email, name: user.name };
  }
}