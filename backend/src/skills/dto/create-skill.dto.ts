// src/skills/dto/create-skill.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ArrayMaxSize } from 'class-validator';

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
  @Min(1) // Assuming category IDs are positive integers
  @Type(() => Number)
  categoryId?: number | null; // Allow null or number

  @IsOptional()
  @IsNumber()
  @Min(0)
  // Max validation depends on maxScore, better handled in service or via custom validator
  @Type(() => Number)
  currentScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000) // Set a reasonable upper limit for max score itself
  @Type(() => Number)
  maxScore?: number;

  @IsOptional()
  @IsString() // Could be an Enum later: 'numeric', 'levels', 'pass_fail'
  ratingScaleType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Each element in the array must be a string
  @ArrayMaxSize(10) // Limit number of tags
  tags?: string[];
}