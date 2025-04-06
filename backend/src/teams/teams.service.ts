// src/teams/teams.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Team, TeamMembership } from '@prisma/client';

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

     // --- Member Management (Placeholder - Add Later) ---
     // async addMember(leaderId: number, teamId: number, memberEmail: string, role: string = 'MEMBER') { ... }
     // async removeMember(leaderId: number, teamId: number, memberId: number) { ... }
     // async getMembers(userId: number, teamId: number) { ... } // Already partially in findOne
}