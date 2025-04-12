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
    // The payload is the decoded JWT content
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true } // Select only needed fields
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token invalid.');
    }
    // What you return here is attached to request.user
    return { userId: user.id, email: user.email, name: user.name };
  }
}