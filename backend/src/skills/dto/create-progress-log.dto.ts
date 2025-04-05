// src/skills/dto/create-progress-log.dto.ts
import {
    IsNumber, Min, IsOptional, IsString, MaxLength, IsInt, IsDateString, IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgressLogDto {
    @IsNumber({}, { message: 'Score must be a number.' })
    @Min(0, { message: 'Score cannot be negative.' })
    // We cannot easily validate against maxScore here in the DTO,
    // so the service-level check `if (createLogDto.score > skill.maxScore)` remains important.
    @IsNotEmpty({ message: 'Score is required.' }) // Make score required
    @Type(() => Number)
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
    timestamp?: Date; // Keep as Date type for transformation, validated as string input
}