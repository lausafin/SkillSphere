// src/teams/dto/update-team.dto.ts
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger'; // Optional

export class UpdateTeamDto {
    @ApiPropertyOptional({ example: 'Bravo Squad', description: 'New name for the team' })
    @IsOptional() // Name is optional during update
    @IsString()
    @IsNotEmpty() // Don't allow empty string if provided
    @MaxLength(100)
    name?: string;
}