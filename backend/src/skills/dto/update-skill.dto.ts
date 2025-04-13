// src/skills/dto/update-skill.dto.ts
import {
    IsString, IsOptional, MaxLength, IsInt, Min, Max, IsArray, ArrayMaxSize, ValidateIf, IsNumber, IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSkillDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty() // Don't allow empty string if name is provided
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    // Allow null explicitly for unsetting, or undefined for no change
    @IsOptional()
    @ValidateIf((object, value) => value !== null) // Only validate if not explicitly null
    @IsInt()
    @Min(1)
    @Type(() => Number)
    categoryId?: number | null; // Allow null to be passed to unset

    // @IsOptional()
    // @IsNumber()
    // @Min(0)
    // // Add @Max based on related maxScore? Requires custom validator or service logic check
    // @Type(() => Number)
    // currentScore?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000)
    @Type(() => Number)
    maxScore?: number;

    @IsOptional()
    @IsString()
    ratingScaleType?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(10)
    tags?: string[];
}