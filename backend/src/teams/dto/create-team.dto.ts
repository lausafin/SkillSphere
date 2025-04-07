// src/teams/dto/create-team.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Optional

export class CreateTeamDto {
    @ApiProperty({ example: 'Alpha Squad', description: 'Name for the new team' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;
}