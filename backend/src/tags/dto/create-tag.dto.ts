// src/tags/dto/create-tag.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// This DTO might be used if you add an endpoint to create tags directly,
// separate from adding them to skills.
export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50) // Tags are usually shorter
  name: string;
}