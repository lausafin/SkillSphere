// src/teams/dto/add-member.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TeamRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Optional

export class AddMemberDto {
    @ApiProperty({ example: 'member@example.com', description: 'Email address of the user to add to the team.' })
    @IsEmail({}, { message: 'Must provide a valid email for the user to add.' })
    @IsNotEmpty()
    email: string;

    @ApiPropertyOptional({ enum: TeamRole, default: TeamRole.MEMBER, description: 'Role to assign to the new member.' })
    @IsOptional()
    @IsEnum(TeamRole, { message: 'Role must be either LEADER or MEMBER.' })
    role?: TeamRole;
}