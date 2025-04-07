// src/skills/dto/skill-data.dto.ts
import { ApiProperty } from '@nestjs/swagger'; // Optional: For Swagger documentation

export class SkillDataDto {
    @ApiProperty() // Optional Swagger example
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    maxScore: number;

    // Add other commonly needed *read-only* fields if necessary,
    // but keep it minimal for contexts like dashboard summaries.
    // @ApiProperty({ required: false, nullable: true })
    // description?: string | null;

    // @ApiProperty({ required: false, nullable: true })
    // categoryId?: number | null;

    // Probably don't include currentScore here unless specifically needed for the context using this DTO
}