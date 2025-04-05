// src/skills/dto/update-skill.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ArrayMaxSize, ValidateIf } from 'class-validator';

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Don't allow empty string if name is provided
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  // Allow explicitly setting description to null or empty string to clear it
  description?: string | null;

  @IsOptional()
  // Allow null to unset the category
  @ValidateIf((object, value) => value !== null) // Only validate if not null
  @IsInt()
  @Min(1)
  @Type(() => Number)
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  // Max validation depends on maxScore
  @Type(() => Number)
  currentScore?: number;

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