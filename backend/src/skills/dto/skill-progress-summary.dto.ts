// Create: backend/src/skills/dto/skill-progress-summary.dto.ts (New File)
import { ApiProperty } from '@nestjs/swagger'; // Optional

// Matches structure needed by MultiSkillProgressChart component
export class SkillProgressHistoryPointScoresDto {
    // Key is Skill ID (as string for object keys), value is normalized score % (0-100) or null
     [skillId: string]: number | null;
}
export class SkillProgressHistoryPointDto {
    @ApiProperty()
    timestamp: number; // Unix ms timestamp for X-axis point
    @ApiProperty()
    dateLabel: string; // Formatted label for display (e.g., 'Apr \'23')
    @ApiProperty({ type: 'object', additionalProperties: { type: 'number', nullable: true } })
    scores: SkillProgressHistoryPointScoresDto;
}

// Main response DTO
export class SkillProgressSummaryDto {
     // Information about the skills included in the summary
     @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
     skillNames: { [skillId: number]: string }; // Map skill ID to skill Name

     @ApiProperty({ type: [SkillProgressHistoryPointDto] })
     history: SkillProgressHistoryPointDto[];
}