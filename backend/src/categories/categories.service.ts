// src/categories/categories.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';

// Use actual DTO classes
interface CreateCategoryDto { name: string; }
interface UpdateCategoryDto { name?: string; }

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async create(userId: number, createCategoryDto: CreateCategoryDto): Promise<Category> {
        try {
            return await this.prisma.category.create({
                data: { name: createCategoryDto.name, userId: userId },
            });
        } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 throw new ConflictException(`Category with name "${createCategoryDto.name}" already exists for this user.`);
             }
             console.error("Error creating category:", error);
             throw new Error('Could not create category.');
        }
    }

    async findAll(userId: number): Promise<Category[]> {
        return this.prisma.category.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }

    // Internal helper or use directly in controller after fetching
    async findOne(userId: number, id: number): Promise<Category | null> {
        const category = await this.prisma.category.findUnique({ where: { id } });
        // Ownership check
        if (!category || category.userId !== userId) {
            return null;
        }
        return category;
    }

     async update(userId: number, id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const existingCategory = await this.findOne(userId, id);
        if (!existingCategory) {
            throw new NotFoundException(`Category with ID ${id} not found or access denied.`);
        }

        if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
             const duplicate = await this.prisma.category.findFirst({
                 where: { userId, name: updateCategoryDto.name, NOT: { id } }
             });
             if (duplicate) {
                 throw new ConflictException(`Category with name "${updateCategoryDto.name}" already exists.`);
             }
        }

        try {
            return await this.prisma.category.update({
                where: { id },
                data: { name: updateCategoryDto.name },
            });
        } catch (error) {
             console.error("Error updating category:", error);
             throw new Error('Could not update category.');
        }
    }

    async remove(userId: number, id: number): Promise<void> {
         const category = await this.findOne(userId, id);
         if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found or access denied.`);
         }
         // Prisma schema onDelete: SetNull handles unlinking skills
         try {
            await this.prisma.category.delete({ where: { id } });
         } catch (error) {
             console.error("Error deleting category:", error);
             throw new Error('Could not delete category.');
         }
    }
}