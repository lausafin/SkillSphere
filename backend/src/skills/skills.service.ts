// src/skills/skills.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Import Prisma types AND generated types explicitly
import { Prisma, Skill, SkillProgressLog, Tag, Team, TeamMembership, User, Goal, SkillEvidence, SkillTag, Category } from '@prisma/client'; // Added all potentially needed types

// --- Import the DTO Classes ---
// Ensure these files exist and export the classes correctly
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateProgressLogDto } from './dto/create-progress-log.dto';

// Define types used in service (import if defined elsewhere)
// Helper type for consistent return values including relations
type SkillWithRelations = Skill & {
    category?: Category | null;
    tags?: (SkillTag & { tag: Tag })[];
    progressLogs?: (SkillProgressLog & { evidence?: SkillEvidence[], user?: Pick<User, 'id'|'name'|'email'> | null })[];
    goals?: Goal[];
    user?: Pick<User, 'id'|'name'> | null; // Author if personal
    team?: (Team & { owner: Pick<User, 'id'|'name'> }) | null; // Team if team skill
};

// Define type for Log with user included
type SkillProgressLogWithUser = SkillProgressLog & {
    user: Pick<User, 'id'|'name'|'email'> | null;
    evidence?: SkillEvidence[];
};


@Injectable()
export class SkillsService {
    // --- CONSTRUCTOR ---
    constructor(private prisma: PrismaService) {}

    // --- HELPER METHODS ---

    // Helper to handle tag creation/connection
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
        return tags; // Return statement was missing implementation before
    }

    // Option: Explicit select in getUserMembership (usually not needed for scalar enum)
    private async getUserMembership(userId: number, teamId: number): Promise<TeamMembership | null> {
        return this.prisma.teamMembership.findUnique({
            where: { userId_teamId: { userId, teamId } },
            // select: { userId: true, teamId: true, role: true, joinedAt: true } // Add explicit select if needed
        });
    }

    // --- PUBLIC SERVICE METHODS ---

    // src/skills/skills.service.ts (create method)
    async create(userId: number, createSkillDto: CreateSkillDto): Promise<SkillWithRelations | null> {
        const { name, categoryId, teamId, tags, notes, ...restData } = createSkillDto;

        // Remove the faulty check for createSkillDto.userId

        // 1. Check Permissions & Validate Relations
        let scopeCheck: Prisma.SkillWhereInput = {}; // For duplicate name check

        if (teamId) {
            // Team Skill Creation Permission Check
            const membership = await this.getUserMembership(userId, teamId);
            if (!membership || membership.role !== 'LEADER') {
                throw new ForbiddenException(`You must be a LEADER to create skills for this team (ID: ${teamId}).`);
            }
            scopeCheck = { teamId: teamId };
        } else {
            // Personal Skill Creation Scope
            scopeCheck = { userId: userId };
        }

        // Duplicate name check
        const duplicate = await this.prisma.skill.findFirst({ where: { ...scopeCheck, name } });
        if (duplicate) { /* ... throw ConflictException ... */ }

        // Category check
        if (categoryId) { /* ... category check ... */ }

        const tagsToConnect = await this.connectOrCreateTags(userId, tags || []);

        try {
            // 3. Create Skill Record
            const newSkill = await this.prisma.skill.create({
                data: {
                    // --- Provide all required fields directly ---
                    name, // name is required
                    description: restData.description,
                    currentScore: restData.currentScore ?? 0,
                    maxScore: restData.maxScore ?? 10,
                    ratingScaleType: restData.ratingScaleType ?? 'numeric',

                    // --- Connect Owner relation directly ---
                    user: !teamId ? { connect: { id: userId } } : undefined, // Connect User if it's personal
                    team: teamId ? { connect: { id: teamId } } : undefined, // Connect Team if it's for a team

                    // --- Other relations ---
                    category: categoryId ? { connect: { id: categoryId } } : undefined,
                    tags: tagsToConnect.length > 0 ? {
                    create: tagsToConnect.map(tag => ({
                        assignedBy: `user:${userId}`,
                        tag: { connect: { id: tag.id } }
                    }))
                    } : undefined,
                }
                // No include needed here
            });

            // 4. Create Initial Progress Log (remains the same)
            if ((createSkillDto.currentScore ?? 0) > 0 || createSkillDto.notes) { /* ... create log ... */ }

            // 5. Refetch with relations
            return this.findOne(userId, newSkill.id);

        } catch (error) { /* ... error handling ... */ }
        throw new InternalServerErrorException("Could not create skill."); // Ensure fallback throw
    }

    async findAll(userId: number): Promise<SkillWithRelations[]> {
        const userMemberships = await this.prisma.teamMembership.findMany({ /* ... */ });
        const teamIds = userMemberships.map(m => m.teamId);
    
        const skills = await this.prisma.skill.findMany({
            where: { OR: [{ userId: userId }, { teamId: { in: teamIds } }] },
            include: { // Include everything needed for SkillWithRelations
                category: true,
                tags: { include: { tag: true } },
                user: { select: { id: true, name: true }},
                team: { // Include team and its owner
                    include: {
                        owner: { select: { id: true, name: true } }
                    }
                 },
                // Decide on including logs/goals for list view? Probably not.
            },
            orderBy: { updatedAt: 'desc' },
        });
        return skills as SkillWithRelations[]; // Cast might still be needed if TS can't perfectly match includes to complex type
    }

    async findOne(userId: number, id: number): Promise<SkillWithRelations | null> {
        const skill = await this.prisma.skill.findUnique({
            where: { id },
            include: {
                category: true,
                tags: { include: { tag: true } },
                progressLogs: { orderBy: { timestamp: 'desc' }, include: { evidence: true, user: { select: {id:true, name:true, email: true}} }},
                goals: true,
                user: { select: { id: true, name: true }},
                team: { include: { owner: { select: { id: true, name: true }}}}
            }
        });

        if (!skill) return null;

        // Check access
        if (skill.userId === userId) return skill as SkillWithRelations; // Cast needed because TS doesn't know includes match perfectly
        if (skill.teamId) {
            const membership = await this.getUserMembership(userId, skill.teamId);
            if (membership) return skill as SkillWithRelations; // Cast needed
        }
        throw new ForbiddenException("Access denied to view this skill.");
    }

    async update(userId: number, id: number, updateSkillDto: UpdateSkillDto): Promise<SkillWithRelations | null> {
         const skill = await this.findOne(userId, id);
         if (!skill) { throw new NotFoundException(`Skill with ID ${id} not found or access denied.`); }

         // Authorization check (Author or Team Leader)
         let canUpdate = false;
         if (skill.userId === userId) { canUpdate = true; }
         else if (skill.teamId) {
             const membership = await this.getUserMembership(userId, skill.teamId);
             if (membership && membership.role === 'LEADER') { canUpdate = true; }
         }
         if (!canUpdate) { throw new ForbiddenException(`You do not have permission to update this skill.`); }

         // Duplicate name check
         if (updateSkillDto.name && updateSkillDto.name !== skill.name) {
             const scopeCheck = skill.userId ? { userId: skill.userId } : { teamId: skill.teamId };
             const duplicate = await this.prisma.skill.findFirst({ where: { ...scopeCheck, name: updateSkillDto.name, NOT: { id } } });
             if (duplicate) { throw new ConflictException(`Skill name "${updateSkillDto.name}" already exists ${skill.userId ? 'for this user' : 'in this team'}.`); }
         }
         // Category check
         if (updateSkillDto.categoryId !== undefined && updateSkillDto.categoryId !== null) {
             const category = await this.prisma.category.findFirst({ where: { id: updateSkillDto.categoryId, userId: userId } });
             if (!category) throw new ForbiddenException('Invalid category specified or category does not belong to you.');
         }
         // Tag update logic
         let tagUpdateOperations = undefined;
         if (updateSkillDto.tags !== undefined) {
             const tagsToSet = await this.connectOrCreateTags(userId, updateSkillDto.tags);
             tagUpdateOperations = { deleteMany: {}, create: tagsToSet.map(tag => ({ assignedBy: `user:${userId}`, tag: { connect: { id: tag.id } } })) };
         }
        // --- Data to Update ---
        // Construct the data object carefully, excluding direct currentScore update
        const dataToUpdate: Prisma.SkillUpdateInput = {
            name: updateSkillDto.name,
            description: updateSkillDto.description,
            // Allow setting category to null or a new ID
            category: updateSkillDto.categoryId !== undefined ? { connect: { id: updateSkillDto.categoryId } } : undefined,
            // Allow updating maxScore
            maxScore: updateSkillDto.maxScore,
            ratingScaleType: updateSkillDto.ratingScaleType,
            // Apply tag operations
            tags: tagUpdateOperations,
            // DO NOT include updateSkillDto.currentScore here
        };
        // Clean undefined properties to avoid Prisma issues
        Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);


        try {
            const updatedSkill = await this.prisma.skill.update({
                where: { id },
                data: dataToUpdate, // Use the prepared data object
                include: { // Re-include relations needed for the return type
                    category: true,
                    tags: { include: { tag: true } },
                    user: { select: { id: true, name: true } },
                    team: { include: { owner: { select: { id: true, name: true }}}}
                    // Add logs/goals include if needed by SkillWithRelations
                }
            });
            return updatedSkill as SkillWithRelations;

        } catch (error) {
            console.error("Error updating skill:", error);
            throw new InternalServerErrorException("Could not update skill.");
        }
    }

    async remove(userId: number, id: number): Promise<void> {
         const skill = await this.findOne(userId, id);
         if (!skill) { throw new NotFoundException(`Skill with ID ${id} not found or access denied.`); }

         // Authorization check
         let canDelete = false;
         if (skill.userId === userId) { canDelete = true; }
         else if (skill.teamId) {
             const membership = await this.getUserMembership(userId, skill.teamId);
             if (membership && membership.role === 'LEADER') { canDelete = true; }
         }
         if (!canDelete) { throw new ForbiddenException(`You do not have permission to delete this skill.`); }

         try {
             await this.prisma.skill.delete({ where: { id } });
         } catch (error) {
             console.error("Error deleting skill:", error);
             throw new InternalServerErrorException("Could not delete skill.");
         }
    }

     // --- Progress Log Methods ---

     async addProgressLog(userId: number, skillId: number, createLogDto: CreateProgressLogDto): Promise<SkillProgressLog> {
         // Check access first
         const skill = await this.findOne(userId, skillId); // Use findOne for combined check
         if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found or access denied.`); }
         // Add specific LOGGING permission if different from VIEWING permission checked by findOne...
         // (Assuming any member can log for now, which findOne allows)

         if (createLogDto.score < 0 || createLogDto.score > skill.maxScore) {
            throw new ForbiddenException(`Score must be between 0 and ${skill.maxScore}.`);
         }

        try {
            const newLog = await this.prisma.$transaction(async (tx) => {
                const createdLog = await tx.skillProgressLog.create({
                    data: {
                        score: createLogDto.score, notes: createLogDto.notes, timeSpentMinutes: createLogDto.timeSpentMinutes, timestamp: createLogDto.timestamp ?? new Date(),
                        skill: { connect: { id: skillId } },
                        user: { connect: { id: userId } }
                    },
                    include: { evidence: true } // Include evidence if needed
                });
                // --- Conditional Skill Update ---
                // ONLY update Skill.currentScore if it's a PERSONAL skill
                if (skill.userId) { // Check if it's a personal skill (userId is set)
                    await tx.skill.update({
                        where: { id: skillId },
                        // Update score ONLY for personal skills
                        data: { currentScore: createLogDto.score, updatedAt: new Date() },
                    });
                } else if (skill.teamId) {
                    // For TEAM skills, just update the timestamp so it appears in "Recent" lists etc.
                    // DO NOT update currentScore on the main Skill record.
                    await tx.skill.update({
                        where: { id: skillId },
                        data: { updatedAt: new Date() }, // Only touch updatedAt
                    });
                }
                return createdLog; // Return from transaction block
            });
            return newLog; // Return the result of the transaction
        } catch (error) {
            console.error("Error adding progress log:", error);
            throw new InternalServerErrorException("Could not add progress log.");
        }
    }

    async getProgressLogs(userId: number, skillId: number): Promise<SkillProgressLogWithUser[]> {
         const skill = await this.findOne(userId, skillId); // Use findOne for permission check
         if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found or access denied.`); }
         // Add specific LOG VIEWING permission if different... (assuming any member can view for now)

        return this.prisma.skillProgressLog.findMany({
            where: { skillId: skillId },
            orderBy: { timestamp: 'desc' },
            include: {
                evidence: true,
                user: { select: { id: true, name: true, email: true }}
            }
        });
    }

} // --- END OF CLASS SkillsService ---

// Ensure supporting types are imported or defined if used in SkillWithRelations/SkillProgressLogWithUser
// import { Goal, SkillEvidence, SkillTag, Category } from '@prisma/client'; // Assuming these are imported