// src/categories/dto/update-category.dto.ts
import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional() // Allow omitting the field if not updating name
  @IsString({ message: 'Category name must be a string.' })
  @IsNotEmpty({ message: 'Category name should not be empty if provided.' }) // Don't allow empty string if field is present
  @MaxLength(100, { message: 'Category name cannot be longer than 100 characters.' })
  name?: string;
}