// src/skills/skills.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Import Prisma types AND generated types explicitly
import { Prisma, Skill, SkillProgressLog, Tag, Team, TeamMembership, User, Goal, SkillEvidence, SkillTag, Category, TeamRole } from '@prisma/client';

// --- Import the DTO Classes ---
// Ensure these files exist and export the classes correctly
import { CreateSkillDto } from './dto/create-skill.dto'; // Should have initialScore?, notes?, teamId?
import { UpdateSkillDto } from './dto/update-skill.dto'; // Should NOT have currentScore
import { CreateProgressLogDto } from './dto/create-progress-log.dto';
// Import supporting DTOs used by TeamDashboardDto or SkillWithRelations if defined elsewhere
import { UserProfileDto } from '../auth/dto/user-profile.dto';
// Import the new DTOs
import { SkillProgressSummaryDto, SkillProgressHistoryPointDto, SkillProgressHistoryPointScoresDto } from './dto/skill-progress-summary.dto';

// Define types used in service
type SkillWithRelations = Omit<Skill, 'currentScore'> & { // Omit removed field
    category?: Category | null;
    tags?: (SkillTag & { tag: Tag })[];
    progressLogs?: SkillProgressLogWithUser[];
    goals?: Goal[];
    user?: Pick<UserProfileDto, 'id'|'name'> | null;
    team?: (Team & { owner: Pick<UserProfileDto, 'id'|'name'> }) | null;
    latestScoreData?: {
        score: number | null;
        timestamp: Date | null;
        userId?: number | null;
    } | null; // Make the whole object nullable
};

type SkillProgressLogWithUser = SkillProgressLog & {
    user: Pick<UserProfileDto, 'id'|'name'|'email'> | null; // Use UserProfileDto for consistency
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
        return tags;
    }

     // Helper to get User Membership for a Team
    private async getUserMembership(userId: number, teamId: number): Promise<TeamMembership | null> {
        return this.prisma.teamMembership.findUnique({
            where: { userId_teamId: { userId, teamId } }
        });
    }

    // Helper to get latest score data
    private async getLatestScoreData(skillId: number, forUserId?: number): Promise<{ score: number | null, timestamp: Date | null, userId?: number | null }> {
        const whereCondition: Prisma.SkillProgressLogWhereInput = { skillId: skillId };
        if (forUserId) { whereCondition.userId = forUserId; }

        const latestLog = await this.prisma.skillProgressLog.findFirst({
            where: whereCondition,
            orderBy: { timestamp: 'desc' },
            select: { score: true, timestamp: true, userId: true }
        });
        return {
            score: latestLog?.score ?? null,
            timestamp: latestLog?.timestamp ?? null,
            userId: latestLog?.userId ?? null
        };
    }

    // --- PUBLIC SERVICE METHODS ---

    async create(userId: number, createSkillDto: CreateSkillDto): Promise<SkillWithRelations | null> {
        const { name, categoryId, teamId, tags, notes, initialScore, maxScore, ...restData } = createSkillDto;

        // 1. Permissions & Validation
        let scopeCheck: Prisma.SkillWhereInput = {};
        if (teamId) {
            const membership = await this.getUserMembership(userId, teamId);
            if (!membership || membership.role !== TeamRole.LEADER) {
                throw new ForbiddenException(`Must be LEADER to create team skills (Team ID: ${teamId}).`);
            }
            scopeCheck = { teamId: teamId };
        } else {
            scopeCheck = { userId: userId };
        }

        const duplicate = await this.prisma.skill.findFirst({ where: { ...scopeCheck, name } });
        if (duplicate) { throw new ConflictException(`Skill name "${name}" already exists ${teamId ? 'in this team' : 'for this user'}.`); }
        if (categoryId) {
             const category = await this.prisma.category.findFirst({ where: { id: categoryId, userId: userId } });
             if (!category) throw new ForbiddenException('Invalid category specified or not owned by user.');
        }
        const tagsToConnect = await this.connectOrCreateTags(userId, tags || []);

        try {
            // 2. Create Skill
            const newSkill = await this.prisma.skill.create({
                data: {
                    name,
                    description: restData.description,
                    maxScore: maxScore ?? 10,
                    ratingScaleType: restData.ratingScaleType ?? 'numeric',
                    user: !teamId ? { connect: { id: userId } } : undefined,
                    team: teamId ? { connect: { id: teamId } } : undefined,
                    category: categoryId ? { connect: { id: categoryId } } : undefined,
                    tags: tagsToConnect.length > 0 ? { create: tagsToConnect.map(tag => ({ assignedBy: `user:${userId}`, tag: { connect: { id: tag.id } } })) } : undefined,
                }
            });

            // 3. Create Initial Log
            if ((initialScore ?? 0) > 0 || notes) {
                 await this.prisma.skillProgressLog.create({
                     data: {
                         score: initialScore ?? 0,
                         notes: notes || 'Initial skill created.',
                         timestamp: new Date(),
                         skill: { connect: { id: newSkill.id } },
                         user: { connect: { id: userId } }
                     }
                 });
            }
            // 4. Refetch with details
            return this.findOne(userId, newSkill.id);

        } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 throw new ConflictException(`Skill name "${name}" likely already exists ${teamId ? 'in this team' : 'for this user'}.`);
             }
             console.error("Error creating skill:", error);
             throw new InternalServerErrorException("Could not create skill.");
        }
    }

    async findAll(userId: number): Promise<SkillWithRelations[]> {
        const userMemberships = await this.prisma.teamMembership.findMany({ where: { userId }, select: { teamId: true } });
        const teamIds = userMemberships.map(m => m.teamId);

        const skills = await this.prisma.skill.findMany({
            where: { OR: [{ userId: userId }, { teamId: { in: teamIds } }] },
            include: { // Base includes for list view
                category: true,
                tags: { include: { tag: true } },
                user: { select: { id: true, name: true }}, // Author if personal
                team: { select: { id: true, name: true }}, // Team if team skill
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Enhance with user's latest score for each skill
        const skillsWithScores = await Promise.all(skills.map(async (skill) => {
            const latestScoreData = await this.getLatestScoreData(skill.id, userId); // Fetch score for the *requesting* user
            return { ...skill, latestScoreData };
        }));

        return skillsWithScores as SkillWithRelations[]; // Cast needed because we added latestScoreData
    }

    async findOne(userId: number, id: number): Promise<SkillWithRelations | null> {
        const skill = await this.prisma.skill.findUnique({
            where: { id },
            include: { // Include necessary relations
                category: true,
                tags: { include: { tag: true } },
                goals: true,
                user: { select: { id: true, name: true }}, // Author
                team: { include: { owner: { select: { id: true, name: true }}}} // Team + Owner
            }
        });

        if (!skill) return null;

        // Check view permission
        let canView = false;
        if (skill.userId === userId) { canView = true; }
        else if (skill.teamId) { const membership = await this.getUserMembership(userId, skill.teamId); if (membership) { canView = true; } }
        if (!canView) throw new ForbiddenException("Access denied to view this skill.");

        // Fetch logs and latest score separately after permission check
        const logs = await this.getProgressLogs(userId, id); // Ensures user can view logs too
        const latestScoreData = await this.getLatestScoreData(id, userId); // Get *requesting user's* latest score

        return { ...skill, progressLogs: logs, latestScoreData } as SkillWithRelations;
    }

    async update(userId: number, id: number, updateSkillDto: UpdateSkillDto): Promise<SkillWithRelations | null> {
         // Fetch skill with enough info for permission check
         const skillToCheck = await this.prisma.skill.findUnique({ where: { id }, select: { userId: true, teamId: true }});
         if (!skillToCheck) throw new NotFoundException(`Skill with ID ${id} not found.`);

         // Authorization check (Author or Team Leader)
         let canUpdate = false;
         if (skillToCheck.userId === userId) { canUpdate = true; }
         else if (skillToCheck.teamId) { const membership = await this.getUserMembership(userId, skillToCheck.teamId); if (membership && membership.role === TeamRole.LEADER) { canUpdate = true; } }
         if (!canUpdate) { throw new ForbiddenException(`You do not have permission to update this skill.`); }

         // Validation (Duplicate Name, Category)
         if (updateSkillDto.name) {
             const skillNameCheck = await this.prisma.skill.findUnique({ where: { id }, select: { name: true }}); // Get current name
             if (updateSkillDto.name !== skillNameCheck?.name) {
                 const scopeCheck = skillToCheck.userId ? { userId: skillToCheck.userId } : { teamId: skillToCheck.teamId };
                 const duplicate = await this.prisma.skill.findFirst({ where: { ...scopeCheck, name: updateSkillDto.name, NOT: { id } } });
                 if (duplicate) { throw new ConflictException(`Skill name "${updateSkillDto.name}" already exists ${skillToCheck.userId ? 'for this user' : 'in this team'}.`); }
             }
         }
         if (updateSkillDto.categoryId !== undefined) { // Check if categoryId is present (even if null)
             if (updateSkillDto.categoryId !== null) { // Only validate if it's not being unset
                 const category = await this.prisma.category.findFirst({ where: { id: updateSkillDto.categoryId, userId: userId } });
                 if (!category) throw new ForbiddenException('Invalid category specified or not owned by user.');
             }
         }
         // Prepare Tag Updates
         let tagUpdateOperations = undefined;
         if (updateSkillDto.tags !== undefined) {
             const tagsToSet = await this.connectOrCreateTags(userId, updateSkillDto.tags);
             tagUpdateOperations = { deleteMany: {}, create: tagsToSet.map(tag => ({ assignedBy: `user:${userId}`, tag: { connect: { id: tag.id } } })) };
         }

        // Prepare data - NO currentScore
        const dataToUpdate: Prisma.SkillUpdateInput = {
            name: updateSkillDto.name,
            description: updateSkillDto.description,
            // Handle category update/unset
            category: updateSkillDto.categoryId !== undefined
                      ? (updateSkillDto.categoryId === null ? { disconnect: true } : { connect: { id: updateSkillDto.categoryId } })
                      : undefined,
            maxScore: updateSkillDto.maxScore,
            ratingScaleType: updateSkillDto.ratingScaleType,
            tags: tagUpdateOperations,
        };
        // Clean undefined properties before update
        Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);


        try {
            // Perform Update
            await this.prisma.skill.update({ where: { id }, data: dataToUpdate });
            // Refetch with findOne for consistent return type including latest score/logs
            return this.findOne(userId, id);
        } catch (error) {
            console.error("Error updating skill:", error);
            throw new InternalServerErrorException("Could not update skill.");
        }
    }

    async remove(userId: number, id: number): Promise<void> {
         // Fetch skill for permission check
         const skillToCheck = await this.prisma.skill.findUnique({ where: { id }, select: { userId: true, teamId: true }});
         if (!skillToCheck) throw new NotFoundException(`Skill with ID ${id} not found.`);

         // Authorization check (Author or Team Leader)
         let canDelete = false;
         if (skillToCheck.userId === userId) { canDelete = true; }
         else if (skillToCheck.teamId) { const membership = await this.getUserMembership(userId, skillToCheck.teamId); if (membership && membership.role === TeamRole.LEADER) { canDelete = true; } }
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
         // Fetch skill for permission check & maxScore validation
         const skill = await this.prisma.skill.findUnique({ where: { id: skillId }, select: { maxScore: true, userId: true, teamId: true }});
         if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found.`); }

         // Check Log Permission (Personal Owner or Any Team Member)
         let canLog = false;
         if (skill.userId === userId) { canLog = true; }
         else if (skill.teamId) { const membership = await this.getUserMembership(userId, skill.teamId); if (membership) { canLog = true; } }
         if (!canLog) { throw new ForbiddenException(`You do not have permission to log progress for this skill.`); }

         // Validate Score
         if (createLogDto.score < 0 || createLogDto.score > skill.maxScore) { throw new ForbiddenException(`Score must be between 0 and ${skill.maxScore}.`); }

        try {
            // Transaction: Create log & update Skill's updatedAt
            const newLog = await this.prisma.$transaction(async (tx) => {
                const createdLog = await tx.skillProgressLog.create({
                    data: {
                        score: createLogDto.score, notes: createLogDto.notes, timeSpentMinutes: createLogDto.timeSpentMinutes, timestamp: createLogDto.timestamp ?? new Date(),
                        skill: { connect: { id: skillId } },
                        user: { connect: { id: userId } } // User doing the logging
                    },
                    // include: { evidence: true } // Add include if needed
                });
                // Only update timestamp on Skill
                await tx.skill.update({ where: { id: skillId }, data: { updatedAt: new Date() } });
                return createdLog;
            });
            return newLog;
        } catch (error) {
            console.error("Error adding progress log:", error);
            throw new InternalServerErrorException("Could not add progress log.");
        }
    }

    async getProgressLogs(userId: number, skillId: number): Promise<SkillProgressLogWithUser[]> {
         // Fetch skill for permission check
         const skill = await this.prisma.skill.findUnique({ where: { id: skillId }, select: { userId: true, teamId: true }});
         if (!skill) { throw new NotFoundException(`Skill with ID ${skillId} not found.`); }

         // Check View Permission (Personal Owner or Any Team Member)
         let canView = false;
         if (skill.userId === userId) { canView = true; }
         else if (skill.teamId) { const membership = await this.getUserMembership(userId, skill.teamId); if (membership) { canView = true; } }
         if (!canView) { throw new ForbiddenException(`You do not have permission to view logs for this skill.`); }

        return this.prisma.skillProgressLog.findMany({
            where: { skillId: skillId },
            orderBy: { timestamp: 'desc' },
            include: {
                evidence: true,
                user: { select: { id: true, name: true, email: true }} // Include user who logged
            }
        });
    }


    // --- NEW: Method for Personal Skill Progress Summary ---
    async getPersonalSkillProgressSummary(userId: number): Promise<SkillProgressSummaryDto> {
        const MAX_SKILLS_ON_CHART = 7; // Max skills to show

        // 1. Find user's personal skills, ordered by recent activity (updatedAt for simplicity here)
        //    Could also order by recent log activity if preferred (more complex query)
        const userSkills = await this.prisma.skill.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: 'desc' },
            take: MAX_SKILLS_ON_CHART, // Limit the number of skills
            select: { id: true, name: true, maxScore: true } // Select needed fields
        });

        if (userSkills.length === 0) {
            return { skillNames: {}, history: [] }; // Return empty if no skills
        }

        const skillIds = userSkills.map(s => s.id);
        const skillMap = new Map(userSkills.map(s => [s.id, s])); // Map ID to Skill info
        const skillNamesMap: { [skillId: number]: string } = {};
        userSkills.forEach(s => { skillNamesMap[s.id] = s.name; });

        // 2. Define Time Range (Last Year)
        const endDate = new Date();
        const startDate = new Date(); startDate.setFullYear(endDate.getFullYear() - 1); startDate.setDate(1); startDate.setHours(0,0,0,0);

        // 3. Fetch Relevant Logs for THIS USER and THESE SKILLS within the date range
        const logs = await this.prisma.skillProgressLog.findMany({
            where: {
                userId: userId, // Logs made by the requesting user
                skillId: { in: skillIds }, // For the selected skills
                timestamp: { gte: startDate } // Within the last year (approx)
            },
            orderBy: { timestamp: 'asc' }, // Chronological order needed for processing
            select: { skillId: true, score: true, timestamp: true }
        });

        // 4. Fetch latest score *before* startDate for initialization for each skill
        const initialScores: { [skillId: number]: number | null } = {};
        for (const skillId of skillIds) {
             const lastLogBefore = await this.prisma.skillProgressLog.findFirst({
                 where: { userId: userId, skillId: skillId, timestamp: { lt: startDate } },
                 orderBy: { timestamp: 'desc' }, select: { score: true }
             });
             initialScores[skillId] = lastLogBefore?.score ?? null;
        }

        // 5. Aggregate into Time Intervals (Monthly)
        const history: SkillProgressHistoryPointDto[] = [];
        let currentIntervalStart = new Date(startDate);
        const lastKnownScores = { ...initialScores }; // Initialize with scores before the period

        while (currentIntervalStart <= endDate) {
            const nextIntervalStart = new Date(currentIntervalStart); nextIntervalStart.setMonth(currentIntervalStart.getMonth() + 1);
            // Use < nextIntervalStart to get logs strictly within the current month interval
            const intervalEndTime = nextIntervalStart.getTime();

            // Find logs pertaining to this interval [start, end)
            const logsThisInterval = logs.filter(log => {
                const ts = log.timestamp.getTime();
                return ts >= currentIntervalStart.getTime() && ts < intervalEndTime;
            });

            // Update last known scores based on the *latest* log within this interval for each skill
             skillIds.forEach(skillId => {
                 const logsForSkillThisInterval = logsThisInterval
                    .filter(log => log.skillId === skillId)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // latest first
                 if (logsForSkillThisInterval.length > 0) {
                     lastKnownScores[skillId] = logsForSkillThisInterval[0].score;
                 }
                 // Otherwise, lastKnownScore for this skill remains unchanged (carried forward)
             });

            // Create data point for the start of this interval using last known scores
             const pointScores: { [skillId: string]: number | null } = {};
            skillIds.forEach(skillId => {
                const score = lastKnownScores[skillId];
                const skillInfo = skillMap.get(skillId);
                const maxScore = skillInfo?.maxScore ?? 10;
                // Normalize to percentage, round for cleaner display
                pointScores[skillId.toString()] = (score !== null && maxScore > 0) ? Math.round((score / maxScore * 100)) : null;
            });

            history.push({
                timestamp: currentIntervalStart.getTime(),
                dateLabel: currentIntervalStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                scores: pointScores
            });

            currentIntervalStart = nextIntervalStart; // Move to next month
        }

        // Ensure at least two points for line chart rendering, duplicate last point if only one exists
        if (history.length === 1) {
             history.push({ ...history[0], timestamp: history[0].timestamp + 1, dateLabel: history[0].dateLabel + '*' }); // Hacky duplicate
        } else if (history.length === 0 && userSkills.length > 0) {
             // If no logs in the last year, create points based on initial scores
             const pointScores: SkillProgressHistoryPointScoresDto = {};
             skillIds.forEach(skillId => { /* ... calculate normalized initial score ... */ });
             history.push({ timestamp: startDate.getTime(), dateLabel: startDate.toLocaleDateString(/*...*/), scores: pointScores });
             history.push({ timestamp: endDate.getTime(), dateLabel: endDate.toLocaleDateString(/*...*/), scores: pointScores }); // Duplicate point if no logs
        }


        return { skillNames: skillNamesMap, history };
    }

} // End Class