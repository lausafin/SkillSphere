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
interface UserProfileDto { id: number; email: string; name?: string; } // Define UserProfileDto

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

    // --- register method (Updated) ---
    async register(registerDto: RegisterDto): Promise<{ accessToken: string; user: UserProfileDto }> { // <-- UPDATED Return Type
        const { email, password, name } = registerDto;

        if (!email || !password) { throw new BadRequestException('Email and password are required.'); }
        // Add DTO validation for production

        const saltRounds = 10;
        let hashedPassword = '';
        try {
             hashedPassword = await bcrypt.hash(password, saltRounds);
        } catch (hashError) {
             console.error("Bcrypt Error during registration hashing:", hashError);
             throw new InternalServerErrorException('Error processing password during registration.');
        }


        try {
            // Create the user (select necessary fields for login payload generation)
            const newUser = await this.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    passwordHash: hashedPassword,
                    name: name,
                },
                select: { id: true, email: true, name: true }, // Select fields needed for login/return DTO
            });

            // --- Automatically Log In ---
            // We have the newUser details, generate the payload and sign the token
            const payload: JwtPayload = { userId: newUser.id, email: newUser.email };
             const userProfile: UserProfileDto = { id: newUser.id, email: newUser.email, name: newUser.name }; // Construct DTO

            // Return the same structure as the login method
            return {
                accessToken: this.jwtService.sign(payload),
                user: userProfile
            };
            // --- End Auto Login ---

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException(`Email address '${email}' is already registered.`);
                }
                console.error(`Prisma Error Code during registration: ${error.code}`, error);
                throw new InternalServerErrorException('A database error occurred during registration.');
            }
            console.error("Unexpected Registration Error:", error);
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