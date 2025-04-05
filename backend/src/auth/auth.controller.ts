// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Ensure correct path
// Use actual DTO classes with validation in a real project
// import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';

// Interfaces for example
interface RegisterDto { email: string; password: string; name?: string; }
interface LoginDto { email: string; password: string; }

@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        // Validation should be handled by DTOs/Pipes
        return this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        // Validation should be handled by DTOs/Pipes
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        // req.user is populated by JwtStrategy.validate
        const userId = req.user.userId; // Ensure payload structure matches
        return this.authService.getProfile(userId);
    }
}