// src/teams/teams.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Team, TeamMembership, User, TeamRole } from '@prisma/client'; // Import Enum TeamRole
import { AddMemberDto } from './dto/add-member.dto';
// Assuming supporting DTOs UserProfileDto, SkillDataDto exist/imported for TeamDashboardDto
import { TeamDashboardDto, TeamDashboardMemberDto, TeamDashboardSkillDto, MemberSkillScoreDto, MemberSkillScoreItemDto, TeamMembershipInfo, MemberSkillHistoryDto, MemberSkillHistoryPointDto, MemberSkillHistoryPointScoresDto } from './dto/team-dashboard.dto';

// Define local types or import DTOs if needed elsewhere
interface CreateTeamDto { name: string; }
interface UpdateTeamDto { name?: string; }
type UserTeamListItem = Team & { owner: Pick<User, 'id'|'name'|'email'>, currentUserRole: TeamRole }; // Define consistent type

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService) {}

    // --- HELPER: Get User Membership ---
    private async getUserMembership(userId: number, teamId: number): Promise<TeamMembership | null> {
        return this.prisma.teamMembership.findUnique({
            where: { userId_teamId: { userId, teamId } }
        });
    }
    // --- HELPER: Ensure LEADER Role ---
    private async ensureUserIsLeader(userId: number, teamId: number): Promise<void> {
        const membership = await this.getUserMembership(userId, teamId);
        // Check if membership exists AND role is LEADER
        if (!membership || membership.role !== TeamRole.LEADER) {
            throw new ForbiddenException('Action requires LEADER role for this team.');
        }
    }

    // --- Team CRUD ---
    async create(userId: number, createTeamDto: CreateTeamDto): Promise<Team> {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const newTeam = await tx.team.create({ data: { name: createTeamDto.name, ownerId: userId } });
                await tx.teamMembership.create({ data: { teamId: newTeam.id, userId: userId, role: TeamRole.LEADER } }); // Use Enum
                return newTeam;
            });
        } catch (error) { /* ... existing error handling (Conflict, InternalServer) ... */ }
        // Ensure fallback throw if needed by control flow
         throw new InternalServerErrorException('Could not create team.');
    }

    async findUserTeams(userId: number): Promise<UserTeamListItem[]> {
         const memberships = await this.prisma.teamMembership.findMany({
             where: { userId },
             include: { team: { include: { owner: { select: { id: true, name: true, email: true }} } } }
         });
         // Map role correctly, ensure owner is included
         const teams = memberships.map(m => ({
              ...m.team, // Spread team details
              owner: m.team.owner, // Explicitly include owner object
              currentUserRole: m.role // Add the user's role from the membership
          }));
         // Sort owned first, then alpha
         teams.sort((a, b) => {
            if (a.ownerId === userId && b.ownerId !== userId) return -1;
            if (a.ownerId !== userId && b.ownerId === userId) return 1;
            return a.name.localeCompare(b.name);
         });
         return teams;
    }

     // Find one team - enhanced to return full details including members/roles
    async findOne(userId: number, teamId: number): Promise<(Team & { members: TeamMembershipInfo[], owner: Pick<User, 'id'|'name'|'email'>, currentUserRole: TeamRole }) | null> {
        const membership = await this.getUserMembership(userId, teamId);
        if (!membership) { throw new ForbiddenException('You are not a member of this team.'); } // Must be member to view details

        const teamDetails = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: {
                    orderBy: { user: { name: 'asc' } }, // Order members alphabetically
                    include: { user: { select: { id: true, name: true, email: true } } }
                },
                // Include skills if needed for this view? Maybe just count?
                // _count: { select: { skills: true } }
            }
        });

        if (!teamDetails) { throw new NotFoundException(`Team with ID ${teamId} not found.`); } // Should be rare if membership exists

        // Format members list
        const membersInfo: TeamMembershipInfo[] = teamDetails.members.map(m => ({
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
            user: m.user,
        }));

        return {
            ...teamDetails,
            members: membersInfo,
            currentUserRole: membership.role // Add requesting user's role
        };
    }


    async update(userId: number, teamId: number, updateTeamDto: UpdateTeamDto): Promise<Team> {
        await this.ensureUserIsLeader(userId, teamId); // Only Leader can update

        // Check for duplicate name (owner check included implicitly by ensureUserIsLeader)
        if (updateTeamDto.name) {
             const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { name: true, ownerId: true }}); // Fetch ownerId too
             if (!team) throw new NotFoundException(); // Should be caught by ensureUserIsLeader
             if (updateTeamDto.name !== team.name) {
                 const duplicate = await this.prisma.team.findFirst({ where: { ownerId: team.ownerId, name: updateTeamDto.name, NOT: { id: teamId } } });
                 if (duplicate) throw new ConflictException(`Team name "${updateTeamDto.name}" already exists for this owner.`);
             }
        }

        try {
            return await this.prisma.team.update({ where: { id: teamId }, data: { name: updateTeamDto.name } });
        } catch (error) { /* ... error handling ... */ }
        throw new InternalServerErrorException('Could not update team.'); // Fallback
    }

    async remove(userId: number, teamId: number): Promise<void> {
         const team = await this.prisma.team.findUnique({ where: { id: teamId }});
         if (!team) throw new NotFoundException(/*...*/);
         // Stricter Rule: Only the original owner can delete the entire team
         if (team.ownerId !== userId) {
              throw new ForbiddenException('Only the original team owner can delete the team.');
         }
         try { await this.prisma.team.delete({ where: { id: teamId } }); }
         catch (error) { /* ... error handling ... */ }
    }

    // --- Member Management ---
    async addMember(leaderId: number, teamId: number, addMemberDto: AddMemberDto): Promise<TeamMembership> {
        await this.ensureUserIsLeader(leaderId, teamId);

        const userToAdd = await this.prisma.user.findUnique({ where: { email: addMemberDto.email.toLowerCase() } }); // Check lowercase email
        if (!userToAdd) { throw new NotFoundException(`User with email ${addMemberDto.email} not found.`); }
        if (userToAdd.id === leaderId) { throw new BadRequestException('Cannot add yourself to the team again.'); }

        const existingMembership = await this.getUserMembership(userToAdd.id, teamId);
        if (existingMembership) { throw new ConflictException(`User ${addMemberDto.email} is already in this team.`); }

        try {
            return await this.prisma.teamMembership.create({
                data: { userId: userToAdd.id, teamId: teamId, role: addMemberDto.role || TeamRole.MEMBER }
            });
        } catch (error) { /* ... error handling ... */ }
        throw new InternalServerErrorException("Could not add member."); // Fallback
    }

    async removeMember(leaderId: number, teamId: number, memberIdToRemove: number): Promise<void> {
        await this.ensureUserIsLeader(leaderId, teamId);

        if (leaderId === memberIdToRemove) { throw new ForbiddenException('Leaders cannot remove themselves.'); } // Prevent self-removal

        const membershipToRemove = await this.prisma.teamMembership.findUnique({
             where: { userId_teamId: { userId: memberIdToRemove, teamId: teamId } },
             include: { team: { select: { ownerId: true } } } // Check if removing original owner
        });
        if (!membershipToRemove) { throw new NotFoundException('Member not found in this team.'); }
        // Prevent removing the original owner if desired?
        // if (memberIdToRemove === membershipToRemove.team.ownerId) {
        //     throw new ForbiddenException('Cannot remove the original team owner.');
        // }
        // Or prevent removing other leaders?
        // if (membershipToRemove.role === TeamRole.LEADER) throw new ForbiddenException('Cannot remove other leaders.');

        try {
            await this.prisma.teamMembership.delete({ where: { userId_teamId: { userId: memberIdToRemove, teamId: teamId } } });
        } catch (error) { /* ... error handling ... */ }
    }

    async getTeamMembers(userId: number, teamId: number): Promise<TeamMembershipInfo[]> {
         const membership = await this.getUserMembership(userId, teamId);
         if (!membership) { throw new ForbiddenException('You must be a member to view the member list.'); }

         const members = await this.prisma.teamMembership.findMany({
            where: { teamId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { user: { name: 'asc' } } // Order alphabetically by user name
         });
         // Use ISO string for date consistency
         return members.map(m => ({ role: m.role, joinedAt: m.joinedAt.toISOString(), user: m.user }));
    }

    // --- Dashboard Data ---
    async getTeamDashboardData(userId: number, teamId: number): Promise<TeamDashboardDto> {
        // Check membership first
        const membership = await this.getUserMembership(userId, teamId);
        if (!membership) { throw new ForbiddenException('You are not a member of this team.'); }

         const teamData = await this.prisma.team.findUnique({
             where: { id: teamId },
             include: {
                 owner: { select: { id: true, name: true, email: true } },
                 members: { include: { user: { select: { id: true, name: true, email: true } } } },
                 skills: { where: { teamId: teamId }, select: { id: true, name: true, maxScore: true } }
             }
         });
         if (!teamData) { throw new NotFoundException(`Team not found.`); }

         // Format members including their roles from the fetched 'members' relation
         const members: TeamDashboardMemberDto[] = teamData.members.map(m => ({
            id: m.user.id, name: m.user.name, email: m.user.email, role: m.role // Include role
         }));
         const teamSkills: TeamDashboardSkillDto[] = teamData.skills;
         const teamSkillIds = teamSkills.map(s => s.id);

         // Get LATEST score for EACH member on EACH team skill
         const memberScoresList: MemberSkillScoreDto[] = [];
         // src/teams/teams.service.ts (Inside getTeamDashboardData loop)
        for (const member of members) {
            const memberId = member.id; // ID of the specific member we're checking
            const scoresForMember: { [skillId: number]: MemberSkillScoreItemDto } = {};
            for (const skillId of teamSkillIds) {
                const latestLog = await this.prisma.skillProgressLog.findFirst({
                    where: {
                        skillId: skillId, // Correct skill
                        userId: memberId, // <<<--- MUST filter by the specific member ID
                    },
                    orderBy: { timestamp: 'desc' },
                    select: { score: true }
                });
                scoresForMember[skillId] = {
                    currentScore: latestLog?.score ?? null // Use null if no log FOUND FOR THIS MEMBER/SKILL
                };
            }
            memberScoresList.push({ memberId, scores: scoresForMember });
        }

         const dashboardData: TeamDashboardDto = {
             teamId: teamData.id, teamName: teamData.name, owner: teamData.owner,
             members: members, teamSkills: teamSkills, memberScores: memberScoresList
         };
         return dashboardData;
    }

    // --- Skill History Data (Aggregation Logic) ---
    async getMemberSkillHistory(requestingUserId: number, teamId: number, targetMemberId: number): Promise<MemberSkillHistoryDto> {
        const membership = await this.getUserMembership(requestingUserId, teamId);
        if (!membership) { throw new ForbiddenException('You must be a member of this team to view history.'); }
        // Optional: Check if targetMemberId is actually in the team? Assumed for now.

        const teamSkills = await this.prisma.skill.findMany({ where: { teamId }, select: { id: true, name: true, maxScore: true } });
        if (teamSkills.length === 0) return { memberId: targetMemberId, skillIds: [], history: [] };
        const skillIds = teamSkills.map(s => s.id);
        const skillMap = new Map(teamSkills.map(s => [s.id, s]));

        const endDate = new Date(); const startDate = new Date(); startDate.setFullYear(endDate.getFullYear() - 1); startDate.setDate(1); startDate.setHours(0,0,0,0);

        const logs = await this.prisma.skillProgressLog.findMany({ where: { userId: targetMemberId, skillId: { in: skillIds }, timestamp: { gte: startDate } }, orderBy: { timestamp: 'asc' }, select: { skillId: true, score: true, timestamp: true } });
        const initialScores: { [skillId: number]: number | null } = {};
        for (const skillId of skillIds) { const lastLogBefore = await this.prisma.skillProgressLog.findFirst({ where: { userId: targetMemberId, skillId: skillId, timestamp: { lt: startDate } }, orderBy: { timestamp: 'desc' }, select: { score: true } }); initialScores[skillId] = lastLogBefore?.score ?? null; }

        const history: MemberSkillHistoryPointDto[] = []; let currentIntervalStart = new Date(startDate); const lastKnownScores = { ...initialScores };
        while (currentIntervalStart <= endDate) {
            const nextIntervalStart = new Date(currentIntervalStart); nextIntervalStart.setMonth(currentIntervalStart.getMonth() + 1); const intervalEnd = (nextIntervalStart > endDate) ? endDate.getTime() + 1 : nextIntervalStart.getTime();
            const logsThisInterval = logs.filter(log => { const ts = log.timestamp.getTime(); return ts >= currentIntervalStart.getTime() && ts < intervalEnd; });
            logsThisInterval.forEach(log => { lastKnownScores[log.skillId] = log.score; });
            const pointScores: MemberSkillHistoryPointScoresDto = {};
            skillIds.forEach(skillId => { const score = lastKnownScores[skillId]; const skillInfo = skillMap.get(skillId); const maxScore = skillInfo?.maxScore ?? 10; pointScores[skillId] = (score !== null && maxScore > 0) ? Math.round((score / maxScore * 100)) : null; }); // Round percentage
            history.push({ timestamp: currentIntervalStart.getTime(), dateLabel: currentIntervalStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), scores: pointScores });
            currentIntervalStart = nextIntervalStart;
        }
        return { memberId: targetMemberId, skillIds, history };
    }

} // End Class