// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

// Use actual DTO classes
interface RegisterDto { email: string; password: string; name?: string; }
interface LoginDto { email: string; password: string; }
interface JwtPayload { userId: number; email: string; }

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = { userId: user.id, email: user.email };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name }
        };
    }

    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        try {
            const newUser = await this.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    passwordHash: hashedPassword,
                    name: name,
                },
                select: { id: true, email: true, name: true, createdAt: true },
            });
            return { user: newUser };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Email address already registered.');
            }
            console.error("Registration Error:", error);
            throw new InternalServerErrorException('Could not register user.');
        }
    }

     async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, createdAt: true }
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
     }
}