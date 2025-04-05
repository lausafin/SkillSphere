// src/auth/auth.service.ts
import {
    Injectable,
    UnauthorizedException, // For login failures
    ConflictException, // For existing email
    InternalServerErrorException, // Keep for truly unexpected errors
    NotFoundException, // For profile lookup if needed
    BadRequestException // Potentially for other validation not caught by pipes
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client'; // Import User type

// Assume DTOs exist (Keep interfaces for context)
interface RegisterDto { email: string; password: string; name?: string; }
interface LoginDto { email: string; password: string; }
interface JwtPayload { userId: number; email: string; }

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    // Validate user credentials for login
    async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
        const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } }); // Ensure consistent casing check

        // Check if user exists and password matches
        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...result } = user; // Exclude password hash
            return result;
        }
        // Return null if user not found or password mismatch
        return null;
    }

    // Handle login request
    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            // Throw specific exception for failed login attempt
            throw new UnauthorizedException('Invalid credentials. Please check email and password.');
        }

        const payload: JwtPayload = { userId: user.id, email: user.email };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name }
        };
    }

    // Handle registration request
    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;

        // Input validation (basic example, rely primarily on ValidationPipe/DTOs)
        if (!email || !password) {
             throw new BadRequestException('Email and password are required.');
        }
        // Add more specific DTO validation using class-validator for production

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
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    // Unique constraint violation (email likely)
                    throw new ConflictException(`Email address '${email}' is already registered.`);
                }
                 // Log other specific Prisma errors if needed
                 console.error(`Prisma Error Code during registration: ${error.code}`, error);
                 // You could potentially map other Prisma codes (like P2003 foreign key constraint)
                 // to BadRequestException if they relate to invalid input IDs.
                 throw new InternalServerErrorException('A database error occurred during registration.'); // More specific than generic Error
            }

            // Catch bcrypt errors (less likely)
             if (error.message.includes('bcrypt')) {
                console.error("Bcrypt Error during registration:", error);
                throw new InternalServerErrorException('Error processing password during registration.');
            }

            // Catch any other unexpected errors
            console.error("Unexpected Registration Error:", error); // Log the full unknown error
            // Keep generic internal server error for truly unexpected issues
            throw new InternalServerErrorException('Could not register user due to an unexpected error.');
        }
    }

    // Get user profile
    async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, createdAt: true }
        });
        if (!user) {
            // This case should technically not happen if JWT is valid and validated correctly
            // by the guard/strategy, but added for robustness.
            throw new NotFoundException('User profile not found.');
        }
        return user;
     }
}