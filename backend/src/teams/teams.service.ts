// src/teams/teams.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Team, TeamMembership } from '@prisma/client';
import { TeamDashboardDto, TeamDashboardMemberDto, TeamDashboardSkillDto, MemberSkillScoreDto } from './dto/team-dashboard.dto'; // Assume DTOs exist

// Assume DTO class exists later
interface CreateTeamDto { name: string; }
interface UpdateTeamDto { name?: string; }

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService) {}

    async create(userId: number, createTeamDto: CreateTeamDto): Promise<Team> {
        try {
            // Create team and automatically add owner as a LEADER member in a transaction
            return await this.prisma.$transaction(async (tx) => {
                const newTeam = await tx.team.create({
                    data: {
                        name: createTeamDto.name,
                        ownerId: userId,
                    }
                });

                await tx.teamMembership.create({
                    data: {
                        teamId: newTeam.id,
                        userId: userId,
                        role: 'LEADER', // Creator is the leader
                    }
                });

                return newTeam; // Return just the team info for now
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Team name "${createTeamDto.name}" already exists for this owner.`);
            }
            console.error("Error creating team:", error);
            throw new InternalServerErrorException('Could not create team.');
        }
    }

    // Find teams where the user is a member (including ones they own)
    async findUserTeams(userId: number): Promise<Team[]> {
         // Fetch teams through the membership join table
         const memberships = await this.prisma.teamMembership.findMany({
             where: { userId },
             include: {
                 team: { // Include the actual team data for each membership
                     include: {
                         owner: { select: { id: true, name: true, email: true }} // Include basic owner info
                     }
                 }
             }
         });
         return memberships.map(m => m.team); // Extract just the team objects
    }

     // Find a specific team, ensuring user is a member
     async findOne(userId: number, teamId: number): Promise<Team & { membership?: TeamMembership }> { // Add membership info
        // Check if user is a member of this team
        const membership = await this.prisma.teamMembership.findUnique({
            where: { userId_teamId: { userId, teamId } },
            include: {
                team: { // Include team details
                     include: {
                         owner: { select: { id: true, name: true, email: true }},
                         members: { // Optionally include other members (select necessary fields)
                             select: { role: true, user: { select: { id: true, name: true, email: true }} }
                         },
                         // skills: { select: { id: true, name: true } } // Optionally include skills count/list later
                     }
                 }
            }
        });

        if (!membership) {
            throw new NotFoundException(`Team with ID ${teamId} not found or you are not a member.`);
        }
        // Return the team data nested within the membership result
        return { ...membership.team, membership: { role: membership.role, joinedAt: membership.joinedAt } as TeamMembership }; // Add user's role/joined date
    }


    // Update a team (only owner can update name for now)
    async update(userId: number, teamId: number, updateTeamDto: UpdateTeamDto): Promise<Team> {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });

        if (!team) throw new NotFoundException(`Team with ID ${teamId} not found.`);
        if (team.ownerId !== userId) throw new ForbiddenException('Only the team owner can update the team.');

        // Check for duplicate name if name is changing
        if (updateTeamDto.name && updateTeamDto.name !== team.name) {
             const duplicate = await this.prisma.team.findFirst({ where: { ownerId: userId, name: updateTeamDto.name, NOT: { id: teamId } } });
             if (duplicate) throw new ConflictException(`Team name "${updateTeamDto.name}" already exists.`);
        }

        try {
            return await this.prisma.team.update({
                where: { id: teamId },
                data: { name: updateTeamDto.name }, // Only allow name update for now
            });
        } catch (error) {
             console.error("Error updating team:", error);
             throw new InternalServerErrorException('Could not update team.');
        }
    }

    // Delete a team (only owner can delete)
    async remove(userId: number, teamId: number): Promise<void> {
         const team = await this.prisma.team.findUnique({ where: { id: teamId } });

         if (!team) throw new NotFoundException(`Team with ID ${teamId} not found.`);
         if (team.ownerId !== userId) throw new ForbiddenException('Only the team owner can delete the team.');

         // Deleting the team will cascade via schema to delete memberships, team skills etc.
         try {
             await this.prisma.team.delete({ where: { id: teamId } });
         } catch (error) {
             console.error("Error deleting team:", error);
             throw new InternalServerErrorException('Could not delete team.');
         }
    }

    // --- NEW: Method for Team Dashboard Data ---
    async getTeamDashboardData(userId: number, teamId: number): Promise<TeamDashboardDto> {
        // 1. Verify user is a member of the team & get basic team/member info
        const membershipCheck = await this.prisma.teamMembership.findFirst({
            where: { userId: userId, teamId: teamId },
        });
        if (!membershipCheck) {
            throw new ForbiddenException('You are not a member of this team.');
        }

        const teamData = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                members: { // Get all members of the team
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                },
                skills: { // Get skills defined FOR THIS TEAM
                    where: { teamId: teamId }, // Redundant but safe check
                    select: { id: true, name: true, maxScore: true } // Select only needed skill fields
                }
            }
        });

        if (!teamData) {
            throw new NotFoundException(`Team with ID ${teamId} not found.`);
            // Should not happen if membership check passed, but good practice
        }

        // 2. Prepare the list of members and skills for the response DTO
        const members: TeamDashboardMemberDto[] = teamData.members.map(m => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            // role: m.role // Add role if needed later
        }));
        const teamSkills: TeamDashboardSkillDto[] = teamData.skills;
        const teamSkillIds = teamSkills.map(s => s.id);

        // 3. Get the LATEST progress log for EACH member on EACH team skill
        // This is the trickiest part for efficiency. Using findFirst + orderBy is one way.
        const memberScoresList: MemberSkillScoreDto[] = [];

        for (const member of members) {
            const memberId = member.id;
            const scoresForMember: { [skillId: number]: { currentScore: number | null } } = {};

            // Find latest log for each relevant skill for this specific member
            for (const skillId of teamSkillIds) {
                const latestLog = await this.prisma.skillProgressLog.findFirst({
                    where: {
                        skillId: skillId,
                        userId: memberId, // Log belongs to this member
                    },
                    orderBy: {
                        timestamp: 'desc', // Get the most recent one
                    },
                    select: {
                        score: true,
                        // timestamp: true // If needed for lastUpdated
                    }
                });
                scoresForMember[skillId] = {
                    currentScore: latestLog ? latestLog.score : null // Store score or null if no log exists
                };
            }
            memberScoresList.push({ memberId, scores: scoresForMember });
        }


        // 4. Construct the final DTO
        const dashboardData: TeamDashboardDto = {
            teamId: teamData.id,
            teamName: teamData.name,
            owner: teamData.owner,
            members: members,
            teamSkills: teamSkills,
            memberScores: memberScoresList
        };

        return dashboardData;
    }

    // --- NEW: Method for Member Skill History (Placeholder) ---
    // Implement the complex aggregation logic here or in a dedicated service later
    // async getMemberSkillHistory(userId: number, teamId: number, memberId: number, /* filters? */) : Promise<MemberSkillHistoryDto> {
    //    // 1. Verify requesting user (userId) is member of teamId
    //    // 2. Verify target member (memberId) is member of teamId
    //    // 3. Get team skills for teamId
    //    // 4. Fetch all relevant SkillProgressLog for memberId on teamSkillIds within time range
    //    // 5. Process logs into time intervals (monthly?), normalize scores, carry forward, etc.
    //    // 6. Return data in MemberSkillHistoryDto format
    //    throw new Error('History endpoint not implemented yet.');
    // }

   } // End Class

     // --- Member Management (Placeholder - Add Later) ---
     // async addMember(leaderId: number, teamId: number, memberEmail: string, role: string = 'MEMBER') { ... }
     // async removeMember(leaderId: number, teamId: number, memberId: number) { ... }
     // async getMembers(userId: number, teamId: number) { ... } // Already partially in findOne