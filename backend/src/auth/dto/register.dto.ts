// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email should not be empty.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password should not be empty.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  // Optional name field during registration
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters.' })
  name?: string;
}
// Note: Password confirmation is typically handled on the frontend,
// not validated again in the backend DTO for registration itself.