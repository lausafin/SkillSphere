// src/skills/skills.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Skill, SkillProgressLog, Tag } from '@prisma/client';

// src/skills/dto/create-skill.dto.ts (New - Class)
import {
    IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min, Max, IsArray, ArrayMaxSize, ValidateIf, IsNumber
} from 'class-validator';
import { Type } from 'class-transformer'; // For type transformation

export class CreateSkillDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number) // Ensures incoming value is transformed to number if possible
    categoryId?: number; // Allow undefined, handle null conversion in service if needed by Prisma

    @IsOptional()
    @IsNumber() // Use IsNumber for flexibility (allows floats if needed later) or IsInt
    @Min(0)
    @Type(() => Number)
    // We might need cross-field validation for currentScore <= maxScore, often done in service or custom validator
    currentScore?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000) // Example max limit
    @Type(() => Number)
    maxScore?: number;

    @IsOptional()
    @IsString() // Could use @IsIn(['numeric', 'levels']) etc. if needed
    ratingScaleType?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(10)
    tags?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

@Injectable()
export class SkillsService {
    constructor(private prisma: PrismaService) {}

    // Helper to handle tag creation/connection
    private async connectOrCreateTags(userId: number, tagNames: string[]): Promise<{ id: number }[]> { // Return array of {id: number}
        if (!tagNames || tagNames.length === 0) return []; // Return empty array
    
        // Clean the tag names
        const cleanTagNames = [...new Set(tagNames.map(name => name.trim()).filter(Boolean))];
        if (cleanTagNames.length === 0) return [];
    
        const tagOperations = cleanTagNames.map(name =>
            this.prisma.tag.upsert({
                where: { userId_name: { userId, name } },
                update: {},
                create: { name, userId },
                select: { id: true } // Select only the ID
            })
        );
        // Execute upserts and get back array of {id: number}
        const tags = await this.prisma.$transaction(tagOperations);
        return tags; // Return the array like [{id: 1}, {id: 5}]
    }

     // Helper to verify ownership
     private async verifySkillOwnership(userId: number, skillId: number): Promise<Skill> {
        const skill = await this.prisma.skill.findUnique({
            where: { id: skillId },
        });
        if (!skill) {
            throw new NotFoundException(`Skill with ID ${skillId} not found.`);
        }
        if (skill.userId !== userId) {
            throw new ForbiddenException('Access denied to this skill.');
        }
        return skill;
   }

   async create(userId: number, createSkillDto: CreateSkillDto): Promise<Skill> {
    // ... (category check) ...

    const tagsToConnect = await this.connectOrCreateTags(userId, createSkillDto.tags || []);

    try {
        const skill = await this.prisma.skill.create({
            data: {
                userId,
                name: createSkillDto.name,
                description: createSkillDto.description,
                categoryId: createSkillDto.categoryId,
                currentScore: createSkillDto.currentScore ?? 0,
                maxScore: createSkillDto.maxScore ?? 10,
                ratingScaleType: createSkillDto.ratingScaleType ?? 'numeric',

                // --- CORRECTED TAG CREATION LOGIC ---
                tags: tagsToConnect.length > 0 ? {
                   create: tagsToConnect.map(tag => ({ // Create entries in SkillTag join table
                       assignedBy: `user:${userId}`, // Example assignment info
                       tag: { // Connect to the actual Tag using its ID
                           connect: { id: tag.id }
                       }
                   }))
                } : undefined, // If no tags, do nothing
                // --- END CORRECTION ---
            },
            include: { category: true, tags: { include: { tag: true } } }
        });

        // --- Create Initial Progress Log ---
        if ((createSkillDto.currentScore ?? 0) > 0 || createSkillDto.notes) {
             await this.prisma.skillProgressLog.create({
                 data: {
                     skillId: skill.id,
                     score: skill.currentScore,
                     notes: createSkillDto.notes || 'Initial score set.',
                     timestamp: new Date(),
                 }
             });
        }
        return skill;

    } catch (error) {
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             throw new ConflictException(`Skill with name "${createSkillDto.name}" already exists.`);
         }
         // Use InternalServerErrorException for better HTTP status code
         console.error("Error creating skill:", error);
         // Throw specific NestJS exception
         throw new InternalServerErrorException("Could not create skill.");
    }
}

    async findAll(userId: number): Promise<Skill[]> {
        return this.prisma.skill.findMany({
            where: { userId },
            include: { category: true, tags: { include: { tag: true } } },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(userId: number, id: number): Promise<Skill | null> {
        const skill = await this.prisma.skill.findUnique({
            where: { id },
            include: {
                category: true,
                tags: { include: { tag: true } },
                progressLogs: { orderBy: { timestamp: 'desc' }, include: { evidence: true }},
                goals: true
            }
        });
        if (!skill || skill.userId !== userId) return null;
        return skill;
    }

    async update(userId: number, id: number, updateSkillDto: UpdateSkillDto): Promise<Skill> {
        // Verify ownership first
        await this.verifySkillOwnership(userId, id);

         // Check for duplicate name if name is being changed
         if (updateSkillDto.name) {
            const duplicate = await this.prisma.skill.findFirst({
                where: { userId, name: updateSkillDto.name, NOT: { id } }
            });
            if (duplicate) {
                throw new ConflictException(`Skill with name "${updateSkillDto.name}" already exists.`);
            }
        }

         // Verify new categoryId if changed
        if (updateSkillDto.categoryId !== undefined && updateSkillDto.categoryId !== null) {
             const category = await this.prisma.category.findFirst({ where: { id: updateSkillDto.categoryId, userId } });
             if (!category) throw new ForbiddenException('Invalid category specified.');
        }

        // Handle tag updates using explicit deleteMany + create (more reliable than 'set' sometimes)
        let tagUpdateOperations = undefined;
        if (updateSkillDto.tags !== undefined) { // Check if tags array is provided (even if empty)
            const tagsToSet = await this.connectOrCreateTags(userId, updateSkillDto.tags);
            tagUpdateOperations = {
                // Delete existing join records first
                deleteMany: {}, // Delete all existing SkillTag entries for this skill
                // Then create the new ones
                create: tagsToSet.map(tag => ({
                    assignedBy: `user:${userId}`, // Example
                    tag: { connect: { id: tag.id } }
                }))
            };
        }

        try {
            return await this.prisma.skill.update({
                where: { id },
                data: {
                    name: updateSkillDto.name,
                    description: updateSkillDto.description,
                    categoryId: updateSkillDto.categoryId, // Handles null correctly if DTO allows
                    currentScore: updateSkillDto.currentScore,
                    maxScore: updateSkillDto.maxScore,
                    ratingScaleType: updateSkillDto.ratingScaleType,
                    // Apply tag operations only if defined
                    tags: tagUpdateOperations,
                },
                include: { category: true, tags: { include: { tag: true } } }
            });
        } catch (error) {
            console.error("Error updating skill:", error);
            // Throw specific NestJS exception
            throw new InternalServerErrorException("Could not update skill.");
        }
    }

    async remove(userId: number, id: number): Promise<void> {
        await this.verifySkillOwnership(userId, id); // Check ownership
        try {
            // Relations handled by Prisma onDelete settings in schema
            await this.prisma.skill.delete({ where: { id } });
        } catch (error) {
             console.error("Error deleting skill:", error);
             throw new InternalServerErrorException("Could not delete skill.");
        }
    }

     // --- Progress Log Methods ---

    async addProgressLog(userId: number, skillId: number, createLogDto: CreateProgressLogDto): Promise<SkillProgressLog> {
        const skill = await this.verifySkillOwnership(userId, skillId);

        if (createLogDto.score < 0 || createLogDto.score > skill.maxScore) {
            throw new ForbiddenException(`Score must be between 0 and ${skill.maxScore}.`);
        }

        try {
            // Use transaction for atomicity
            return await this.prisma.$transaction(async (tx) => {
                const newLog = await tx.skillProgressLog.create({
                    data: {
                        skillId: skillId,
                        score: createLogDto.score,
                        notes: createLogDto.notes,
                        timeSpentMinutes: createLogDto.timeSpentMinutes,
                        timestamp: createLogDto.timestamp ?? new Date(),
                        // Add evidence handling here if needed
                    },
                     include: { evidence: true }
                });

                // Update parent skill
                await tx.skill.update({
                    where: { id: skillId },
                    data: { currentScore: createLogDto.score, updatedAt: new Date() },
                });
                return newLog;
            });
        } catch (error) {
            console.error("Error adding progress log:", error);
            throw new InternalServerErrorException("Could not add progress log.");
        }
    }

    async getProgressLogs(userId: number, skillId: number): Promise<SkillProgressLog[]> {
        await this.verifySkillOwnership(userId, skillId);
        return this.prisma.skillProgressLog.findMany({
            where: { skillId: skillId },
            orderBy: { timestamp: 'desc' },
             include: { evidence: true }
        });
    }
}