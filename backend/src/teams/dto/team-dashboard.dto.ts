// src/teams/dto/team-dashboard.dto.ts
import { ApiProperty } from '@nestjs/swagger'; // Optional
// --- IMPORT THE ACTUAL DTOs ---
import { SkillDataDto } from '../../skills/dto/skill-data.dto';
import { UserProfileDto } from '../../auth/dto/user-profile.dto';
// --- END IMPORTS ---

// Basic info for a member shown on the dashboard
// Inherit basic ID, name, email from UserProfileDto
export class TeamDashboardMemberDto extends UserProfileDto {
    // Add role if needed later and returned by backend service
    // @ApiProperty({ example: 'MEMBER' })
    // role?: string;
}

// Represents a team skill relevant to the dashboard
// Can directly use SkillDataDto if it contains sufficient info (id, name, maxScore)
export class TeamDashboardSkillDto extends SkillDataDto {
    // Inherits id, name, maxScore
    // Add specific fields here only if they differ from SkillDataDto
}

// Represents a member's current proficiency on the team skills
export class MemberSkillScoreItemDto { // DTO for the score object
    @ApiProperty({ type: 'number', nullable: true, description: 'Score, or null if not logged' })
    currentScore: number | null;
}
export class MemberSkillScoreDto {
    @ApiProperty({ description: "ID of the team member" })
    memberId: number;

    @ApiProperty({
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/MemberSkillScoreItemDto' }, // For Swagger
        description: 'Object mapping Skill ID to the member\'s score object'
    })
    scores: {
        [skillId: number]: MemberSkillScoreItemDto // Use the item DTO
    };
}

// The main response DTO for the dashboard endpoint
export class TeamDashboardDto {
    @ApiProperty()
    teamId: number;

    @ApiProperty()
    teamName: string;

    @ApiProperty({ type: () => UserProfileDto }) // For Swagger relation typing
    owner: UserProfileDto;

    @ApiProperty({ type: [TeamDashboardMemberDto] }) // Array of members
    members: TeamDashboardMemberDto[];

    @ApiProperty({ type: [TeamDashboardSkillDto] }) // Array of team skills
    teamSkills: TeamDashboardSkillDto[];

    @ApiProperty({ type: [MemberSkillScoreDto] }) // Array of score objects per member
    memberScores: MemberSkillScoreDto[];
}


// --- Optional: DTO for fetching historical data ---
export class MemberSkillHistoryPointScoresDto {
    // Keyed by Skill ID, value is normalized score (0-100) or null
     [skillId: number]: number | null;
}
export class MemberSkillHistoryPointDto {
    @ApiProperty()
    timestamp: number;
    @ApiProperty()
    dateLabel: string;
    @ApiProperty({ type: 'object', additionalProperties: { type: 'number', nullable: true } }) // Swagger hint
    scores: MemberSkillHistoryPointScoresDto;
}
export class MemberSkillHistoryDto {
     @ApiProperty()
     memberId: number;
     @ApiProperty({ type: [Number] })
     skillIds: number[];
     @ApiProperty({ type: [MemberSkillHistoryPointDto] })
     history: MemberSkillHistoryPointDto[];
}

import { TeamRole } from '@prisma/client';
// Ensure TeamMemberUser is defined and exported if needed by TeamMembershipInfo
export class TeamMemberUser extends UserProfileDto {} // Example if extending

// --- ENSURE EXPORT HERE ---
export class TeamMembershipInfo {
    // @ApiProperty({ enum: TeamRole }) // Optional swagger
    role: TeamRole;
    // @ApiProperty()
    joinedAt: string; // Changed to string as returned by service now
    // @ApiProperty({ type: () => TeamMemberUser })
    user: TeamMemberUser;
}