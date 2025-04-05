// src/categories/categories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus, UsePipes, ValidationPipe, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Correct path
// Use actual DTO classes
interface CreateCategoryDto { name: string; }
interface UpdateCategoryDto { name?: string; }


@Controller('api/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  //@UsePipes(new ValidationPipe({ whitelist: true })) // Uncomment if using class DTOs
  create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    // req.user contains { userId, email, name } from JwtStrategy
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOne(req.user.userId, id);
    if (!category) {
         throw new NotFoundException(`Category with ID ${id} not found or access denied.`);
    }
    return category;
  }

  @Patch(':id')
  //@UsePipes(new ValidationPipe({ whitelist: true })) // Uncomment if using class DTOs
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(req.user.userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    // Service method throws NotFound or Forbidden if needed
    await this.categoriesService.remove(req.user.userId, id);
  }
}