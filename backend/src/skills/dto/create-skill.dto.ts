// src/skills/dto/create-skill.dto.ts (New - Class)
import {
    IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min, Max, IsArray, ArrayMaxSize, ValidateIf, IsNumber
} from 'class-validator';
import { Type } from 'class-transformer'; // For type transformation

export class CreateSkillDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number) // Ensures incoming value is transformed to number if possible
    categoryId?: number; // Allow undefined, handle null conversion in service if needed by Prisma

    @IsOptional()
    @IsNumber() // Use IsNumber for flexibility (allows floats if needed later) or IsInt
    @Min(0)
    @Type(() => Number)
    initialScore?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000) // Example max limit
    @Type(() => Number)
    maxScore?: number;

    @IsOptional()
    @IsString() // Could use @IsIn(['numeric', 'levels']) etc. if needed
    ratingScaleType?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(10)
    tags?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;

    @IsOptional() // Allow omitting for personal skills
    @IsInt()
    @Min(1)
    @Type(() => Number)
    teamId?: number; // <-- ENSURE THIS EXISTS
}