// src/categories/dto/create-category.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Category name must be a string.' })
  @IsNotEmpty({ message: 'Category name should not be empty.' })
  @MaxLength(100, { message: 'Category name cannot be longer than 100 characters.' })
  name: string;
}