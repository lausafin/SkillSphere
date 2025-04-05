// src/skills/skills.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Skill, SkillProgressLog, Tag } from '@prisma/client';

// Use actual DTO classes
interface CreateSkillDto { name: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }
interface UpdateSkillDto { name?: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }
interface CreateProgressLogDto { score: number; notes?: string; timeSpentMinutes?: number; timestamp?: Date; }

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
        // Verify categoryId if provided
        if (createSkillDto.categoryId) {
             const category = await this.prisma.category.findFirst({ where: { id: createSkillDto.categoryId, userId } });
             if (!category) throw new ForbiddenException('Invalid category specified.');
        }

        const tagConnections = await this.connectOrCreateTags(userId, createSkillDto.tags || []);

        try {
            const skill = await this.prisma.skill.create({
                data: {
                    userId,
                    name: createSkillDto.name,
                    description: createSkillDto.description,
                    categoryId: createSkillDto.categoryId,
                    // Use connect with the array of { id: tagId } for the 'Tag' side
                    tags: tagConnections.length > 0 ? {
                        create: tagConnections.map(tag => ({ // Create entries in SkillTag join table
                            assignedBy: `user:${userId}`, // Example assignment info
                            tag: { // Connect to the Tag using its ID
                                connect: { id: tag.id }
                            }
                        }))
                     } : undefined, // Use create on the join table relation
                },
                include: { category: true, tags: { include: { tag: true } } }
            });
            return skill;
        } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 throw new ConflictException(`Skill with name "${createSkillDto.name}" already exists.`);
             }
             console.error("Error creating skill:", error);
             throw new Error("Could not create skill.");
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

        // Handle tag updates
        let tagUpdateOperation = undefined;
        if (updateSkillDto.tags !== undefined) { // Check if tags array is provided (even if empty)
             const newTagConnections = await this.connectOrCreateTags(userId, updateSkillDto.tags);
             tagUpdateOperation = { set: newTagConnections || [] }; // Use set to replace existing tags
        }

        try {
            return await this.prisma.skill.update({
                where: { id },
                data: {
                    name: updateSkillDto.name,
                    description: updateSkillDto.description,
                    categoryId: updateSkillDto.categoryId, // Handles null correctly
                    currentScore: updateSkillDto.currentScore,
                    maxScore: updateSkillDto.maxScore,
                    ratingScaleType: updateSkillDto.ratingScaleType,
                    tags: tagUpdateOperation, // Apply tag update operation if defined
                     // updatedAt automatically updated by Prisma
                },
                 include: { category: true, tags: { include: { tag: true } } }
            });
        } catch (error) {
             console.error("Error updating skill:", error);
             throw new Error("Could not update skill.");
        }
    }

    async remove(userId: number, id: number): Promise<void> {
        await this.verifySkillOwnership(userId, id); // Check ownership
        try {
            // Relations handled by Prisma onDelete settings in schema
            await this.prisma.skill.delete({ where: { id } });
        } catch (error) {
             console.error("Error deleting skill:", error);
             throw new Error("Could not delete skill.");
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
            throw new Error("Could not add progress log.");
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