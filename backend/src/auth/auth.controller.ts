// src/auth/auth.controller.ts
import {
    Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus,
    UsePipes, ValidationPipe // Added for potential DTO validation
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Corrected path assumption

// Import actual DTO classes if created
// import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';

// Interfaces for example
interface RegisterDto { email: string; password: string; name?: string; }
interface LoginDto { email: string; password: string; }
interface UserProfileDto { id: number; email: string; name?: string; } // Define UserProfileDto
interface AuthResponse { accessToken: string; user: UserProfileDto; }

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    // Apply validation pipe if using DTO classes with decorators
    // @UsePipes(new ValidationPipe({ whitelist: true }))
    async login(@Body() loginDto: LoginDto) {
        // Service now throws UnauthorizedException on failure
        return this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    // @UsePipes(new ValidationPipe({ whitelist: true }))
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> { // <-- UPDATED return type
        // Service now returns token and user upon successful registration
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        const userId = req.user.userId;
        // Service now throws NotFoundException if user mysteriously disappears
        return this.authService.getProfile(userId);
    }
}