// src/auth/dto/user-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger'; // Optional

export class UserProfileDto {
    @ApiProperty()
    id: number;

    @ApiProperty({ required: false, nullable: true })
    name: string | null;

    @ApiProperty()
    email: string;

    // Add other fields safe to expose if needed, e.g., createdAt
    // @ApiProperty()
    // createdAt: Date;
}