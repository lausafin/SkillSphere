// src/skills/dto/create-progress-log.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, IsDateString } from 'class-validator';

export class CreateProgressLogDto {
  @IsNumber({}, { message: 'Score must be a number.' })
  @Min(0, { message: 'Score cannot be negative.' })
  // @Max decorator might be better applied in the service after fetching the skill's maxScore
  // Or receive maxScore from frontend if necessary for validation here
  @IsNotEmpty({ message: 'Score is required.' })
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Notes cannot be longer than 2000 characters.' })
  notes?: string;

  @IsOptional()
  @IsInt({ message: 'Time spent must be an integer (minutes).' })
  @Min(0, { message: 'Time spent cannot be negative.' })
  @Type(() => Number) // Ensure transformation from string if needed
  timeSpentMinutes?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Timestamp must be a valid ISO 8601 date string.' })
  timestamp?: string; // Receive as string, Prisma handles conversion
}