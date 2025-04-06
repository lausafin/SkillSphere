// src/skills/skills.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Import Prisma types AND generated types explicitly
import { Prisma, Skill, SkillProgressLog, Tag, Team, TeamMembership, User } from '@prisma/client'; // Added Team, TeamMembership, User

// --- Import the DTO Classes ---
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateProgressLogDto } from './dto/create-progress-log.dto';

// Define a type combining Skill with optional relations we often include
// This helps TypeScript understand the shape of objects after 'include'
type SkillWithRelations = Skill & {
    category?: { id: number; name: string } | null;
    tags?: (SkillTag & { tag: Tag })[];
    progressLogs?: (SkillProgressLog & { evidence?: SkillEvidence[], user?: Pick<User, 'id'|'name'|'email'> })[]; // Include user for logs
    goals?: Goal[];
    user?: Pick<User, 'id'|'name'> | null; // Author if personal
    team?: (Team & { owner: Pick<User, 'id'|'name'> }) | null; // Team if team skill
};

// Define type for Log with user included
type SkillProgressLogWithUser = SkillProgressLog & {
    user: Pick<User, 'id'|'name'|'email'> | null; // Prisma include might make user nullable if relation optional
    evidence?: SkillEvidence[];
};


@Injectable()
export class SkillsService {
    constructor(private prisma: PrismaService) {}

    // --- HELPER METHODS (Ensure full implementation is here) ---
    private async connectOrCreateTags(userId: number, tagNames: string[]): Promise<{ id: number }[]> {
        if (!tagNames || tagNames.length === 0) return [];
        const cleanTagNames = [...new Set(tagNames.map(name => name.trim()).filter(Boolean))];
        if (cleanTagNames.length === 0) return [];
        const tagOperations = cleanTagNames.map(name =>
            this.prisma.tag.upsert({
                where: { userId_name: { userId, name } },
                update: {}, create: { name, userId }, select: { id: true }
            })
        );
        const tags = await this.prisma.$transaction(tagOperations);
        return tags; // <-- RETURN STATEMENT NEEDED
    }

    private async verifySkillOwnership(userId: number, skillId: number): Promise<Skill> {
        const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
        if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found.`); }
        if (skill.userId !== userId) {
            // TODO: Add proper team membership check here if skill.teamId is set
            throw new ForbiddenException('Access denied to this skill.');
        }
        return skill; // <-- RETURN STATEMENT NEEDED
   }

    // --- PUBLIC METHODS ---

    async create(userId: number, createSkillDto: CreateSkillDto): Promise<SkillWithRelations | null> { // Return detailed type or null
        if (createSkillDto.categoryId) { /* ... category check ... */ }
        const tagsToConnect = await this.connectOrCreateTags(userId, createSkillDto.tags || []);

        try {
            const newSkill = await this.prisma.skill.create({
                data: {
                    name: createSkillDto.name,
                    description: createSkillDto.description,
                    currentScore: createSkillDto.currentScore ?? 0,
                    maxScore: createSkillDto.maxScore ?? 10,
                    ratingScaleType: createSkillDto.ratingScaleType ?? 'numeric',
                    // Assign Ownership - Assuming personal skill for now
                    user: { connect: { id: userId } }, // Connect to user who authored it
                    // team: undefined, // Explicitly undefined if not a team skill
                    // Connect Category if provided
                    category: createSkillDto.categoryId ? { connect: { id: createSkillDto.categoryId } } : undefined,
                    // Connect Tags
                    tags: tagsToConnect.length > 0 ? {
                       create: tagsToConnect.map(tag => ({
                           assignedBy: `user:${userId}`,
                           tag: { connect: { id: tag.id } }
                       }))
                    } : undefined,
                },
                // No include needed here, we will refetch with findOne
            });

            // Create Initial Progress Log
            if ((createSkillDto.currentScore ?? 0) > 0 || createSkillDto.notes) {
                 await this.prisma.skillProgressLog.create({
                     data: {
                         score: newSkill.currentScore,
                         notes: createSkillDto.notes || 'Initial score set.',
                         timestamp: new Date(),
                         skill: { connect: { id: newSkill.id } },
                         user: { connect: { id: userId } } // User creating the skill/log
                     }
                 });
            }
            // Refetch to get all standard relations
            return this.findOne(userId, newSkill.id);

        } catch (error) { /* ... existing error handling ... */ }
        return null; // Added fallback return
    }

    async findAll(userId: number): Promise<SkillWithRelations[]> { // Use detailed type
         // TODO: Fetch skills from user's teams as well
        return this.prisma.skill.findMany({
            where: { userId: userId }, // Only personal for now
            include: { // Standard includes for list view
                category: true,
                tags: { include: { tag: true } },
                // Maybe limit logs here? Or exclude by default?
                // progressLogs: { orderBy: { timestamp: 'desc' }, take: 1 }
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(userId: number, id: number): Promise<SkillWithRelations | null> { // Use detailed type
        const skill = await this.prisma.skill.findUnique({
            where: { id },
            include: { // Define all relations needed for subsequent checks/return
                category: true,
                tags: { include: { tag: true } },
                progressLogs: { orderBy: { timestamp: 'desc' }, include: { evidence: true, user: { select: {id:true, name:true, email: true}} }},
                goals: true,
                user: { select: { id: true, name: true }}, // Author
                team: { include: { owner: { select: { id: true, name: true }}}} // Team
            }
        });

        if (!skill) return null;

        // Ownership/Membership check
        if (skill.userId === userId) return skill; // Is personal skill
        if (skill.teamId) { // Check team membership ONLY if teamId is present
            const membership = await this.prisma.teamMembership.findUnique({ // Use Prisma Client property
                 where: { userId_teamId: { userId, teamId: skill.teamId } }
             });
             if (membership) return skill; // Is team member
        }

        // If neither applies, throw forbidden or return null based on desired behavior
        throw new ForbiddenException("Access denied to this skill resource.");
        // return null;
    }


    async update(userId: number, id: number, updateSkillDto: UpdateSkillDto): Promise<SkillWithRelations | null> { // Return type can be null if findOne fails initially
        // Fetch first to check permissions and scope
        const skill = await this.findOne(userId, id); // Use findOne which includes permission check AND relations
        if (!skill) {
           // findOne might throw ForbiddenException or return null
           throw new NotFoundException(`Skill with ID ${id} not found or access denied.`);
        }

        // Authorization check (Refine as needed)
        let canUpdate = false;
        if (skill.userId === userId) { canUpdate = true; }
        else if (skill.teamId) {
            // Check if the already fetched skill has the needed membership info,
            // or fetch membership explicitly if findOne doesn't guarantee it.
            // Assuming findOne includes necessary details or we fetch membership:
            const membership = await this.prisma.teamMembership.findUnique({ where: { userId_teamId: { userId, teamId: skill.teamId } } });
            if (membership && membership.role === 'LEADER') { canUpdate = true; }
        }
        if (!canUpdate) { throw new ForbiddenException(`You do not have permission to update this skill.`); }

        // Duplicate name check
        if (updateSkillDto.name && updateSkillDto.name !== skill.name) { /* ... duplicate check ... */ }
        // Category check
        if (updateSkillDto.categoryId !== undefined && updateSkillDto.categoryId !== null) { /* ... category check ... */ }
        // Tag update logic
        let tagUpdateOperations = undefined;
        if (updateSkillDto.tags !== undefined) { /* ... tag logic ... */
           const tagsToSet = await this.connectOrCreateTags(userId, updateSkillDto.tags);
           tagUpdateOperations = {
               deleteMany: {},
               create: tagsToSet.map(tag => ({
                   assignedBy: `user:${userId}`,
                   tag: { connect: { id: tag.id } }
               }))
           };
        }

       try {
           const updatedSkill = await this.prisma.skill.update({
               where: { id },
               data: { // Only include fields present in UpdateSkillDto
                   name: updateSkillDto.name,
                   description: updateSkillDto.description,
                   categoryId: updateSkillDto.categoryId,
                   currentScore: updateSkillDto.currentScore,
                   maxScore: updateSkillDto.maxScore,
                   ratingScaleType: updateSkillDto.ratingScaleType,
                   tags: tagUpdateOperations,
               },
               // --- CORRECTED INCLUDE FOR UPDATE RETURN ---
               include: {
                   category: true,
                   tags: { include: { tag: true } },
                   user: { select: { id: true, name: true } }, // Select needed user fields
                   team: { // Include team...
                       include: { // ...and explicitly include its owner with selected fields
                           owner: { select: { id: true, name: true } }
                       }
                    }
                    // Include progressLogs and goals if needed in the return type SkillWithRelations
                    // progressLogs: { orderBy: { timestamp: 'desc' }, include: { evidence: true, user: { select: {id:true, name:true, email: true}} }},
                    // goals: true,
               }
               // --- END CORRECTION ---
           });
           // The type assertion might now work, or TS might infer correctly due to the include.
           // If TS still complains, double-check SkillWithRelations definition matches EXACTLY what's included.
           return updatedSkill as SkillWithRelations;

       } catch (error) {
           console.error("Error updating skill:", error);
           throw new InternalServerErrorException("Could not update skill.");
       }
   }



    async remove(userId: number, id: number): Promise<void> {
        // Fetch first to check permissions
        const skill = await this.findOne(userId, id); // Use findOne which includes permission check
        if (!skill) { throw new NotFoundException(`Skill with ID ${id} not found or access denied.`); }

        // Authorization check (similar to update)
        let canDelete = false;
        if (skill.userId === userId) { canDelete = true; }
        else if (skill.teamId) {
             const membership = await this.prisma.teamMembership.findUnique({ where: { userId_teamId: { userId, teamId: skill.teamId } } });
             if (membership && membership.role === 'LEADER') { canDelete = true; } // Example: Only Leader delete team skill
        }
        if (!canDelete) { throw new ForbiddenException(`You do not have permission to delete this skill.`); }

        try {
            await this.prisma.skill.delete({ where: { id } }); // Use 'this.prisma'
        } catch (error) { /* ... error handling ... */ }
    }

     // --- Progress Log Methods ---

     async addProgressLog(userId: number, skillId: number, createLogDto: CreateProgressLogDto): Promise<SkillProgressLog> {
         // Check if user can access the skill first
         const skill = await this.findOne(userId, skillId); // Use findOne which checks membership/ownership
         if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found or access denied.`); }
         // Note: findOne might throw ForbiddenException already depending on its implementation

         // Add specific permission check for LOGGING if different from VIEWING (e.g., maybe only author/leader can log?)
         // For now, assume if they can view (via findOne success), they can log.

        if (createLogDto.score < 0 || createLogDto.score > skill.maxScore) { /* ... score check ... */ }

        try {
            return await this.prisma.$transaction(async (tx) => { // Use 'this.prisma'
                const newLog = await tx.skillProgressLog.create({
                    data: { // Use connect syntax
                        score: createLogDto.score, notes: createLogDto.notes, timeSpentMinutes: createLogDto.timeSpentMinutes, timestamp: createLogDto.timestamp ?? new Date(),
                        skill: { connect: { id: skillId } },
                        user: { connect: { id: userId } }
                    },
                    // include: { evidence: true } // Include if needed
                });
                await tx.skill.update({ where: { id: skillId }, data: { currentScore: createLogDto.score, updatedAt: new Date() } });
                return newLog;
            });
        } catch (error) { /* ... error handling ... */ }
        // Add fallback
         throw new InternalServerErrorException("Could not add progress log.");
    }


    async getProgressLogs(userId: number, skillId: number): Promise<SkillProgressLogWithUser[]> { // Return detailed type
         // Check if user can access the skill first
         const skill = await this.findOne(userId, skillId); // Use findOne which checks membership/ownership
         if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found or access denied.`); }

        // Fetch logs including the user who created the log
        return this.prisma.skillProgressLog.findMany({ // Use 'this.prisma'
            where: { skillId: skillId },
            orderBy: { timestamp: 'desc' },
            include: { // Correct include structure
                evidence: true,
                user: { // Include the 'user' relation
                    select: { id: true, name: true, email: true } // Select specific fields from user
                }
            }
        });
    }

} // --- END OF CLASS SkillsService ---

// Make sure necessary Prisma types referenced in SkillWithRelations are imported or defined
import { SkillTag, Goal, SkillEvidence } from '@prisma/client';