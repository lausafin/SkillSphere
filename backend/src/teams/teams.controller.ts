// src/teams/teams.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request,
  ParseIntPipe, HttpCode, HttpStatus, UsePipes, ValidationPipe, ForbiddenException, NotFoundException
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Corrected path
import { Team, TeamMembership, User, TeamRole } from '@prisma/client'; // Consolidated Prisma imports

// Import DTOs - Assuming they are classes now
import { CreateTeamDto } from './dto/create-team.dto'; // Assuming this class exists
import { UpdateTeamDto } from './dto/update-team.dto'; // Assuming this class exists
import { AddMemberDto } from './dto/add-member.dto';
import { TeamDashboardDto, TeamMembershipInfo, MemberSkillHistoryDto } from './dto/team-dashboard.dto';

// Define return type for findUserTeams based on service logic
type UserTeamListItemDto = Team & { owner: Pick<User, 'id'|'name'|'email'>, currentUserRole: TeamRole };

// Define local interface if needed for return type hints, or rely on Prisma types/DTOs
// Example: type FullTeamDetails = (Team & { members: TeamMembershipInfo[], owner: Pick<User, 'id'|'name'|'email'>, currentUserRole: TeamRole });


@Controller('teams')
@UseGuards(JwtAuthGuard) // Protect all team routes
export class TeamsController {
constructor(private readonly teamsService: TeamsService) {}

@Post()
@HttpCode(HttpStatus.CREATED)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Validate DTO
create(@Request() req, @Body() createTeamDto: CreateTeamDto): Promise<Team> {
  return this.teamsService.create(req.user.userId, createTeamDto);
}

@Get() // Get teams the current user is a member of
findUserTeams(@Request() req): Promise<UserTeamListItemDto[]> { // Use the defined type
  return this.teamsService.findUserTeams(req.user.userId);
}

@Get(':id') // Get specific team details (if user is member)
// Define a more specific return type if needed, maybe using the FullTeamDetails example type
findOne(@Request() req, @Param('id', ParseIntPipe) id: number): ReturnType<TeamsService['findOne']> /*Promise<FullTeamDetails | null>*/ {
  return this.teamsService.findOne(req.user.userId, id);
}

// --- Dashboard Endpoint ---
@Get(':id/dashboard')
getTeamDashboardData(
  @Request() req,
  @Param('id', ParseIntPipe) teamId: number
): Promise<TeamDashboardDto> {
    return this.teamsService.getTeamDashboardData(req.user.userId, teamId);
}

// --- Skill History Endpoint ---
 @Get(':id/members/:memberId/history')
 getMemberSkillHistory(
     @Request() req,
     @Param('id', ParseIntPipe) teamId: number,
     @Param('memberId', ParseIntPipe) memberId: number,
 ): Promise<MemberSkillHistoryDto> {
     // Service method checks if requester is member of team teamId
     return this.teamsService.getMemberSkillHistory(req.user.userId, teamId, memberId);
 }


@Patch(':id') // Update team name (requires ownership/leader)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto
): Promise<Team> {
  // Service method handles permission check
  return this.teamsService.update(req.user.userId, id, updateTeamDto);
}

@Delete(':id') // Delete team (requires ownership)
@HttpCode(HttpStatus.NO_CONTENT)
async remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
   // Service method handles permission check
  await this.teamsService.remove(req.user.userId, id);
}

 // --- Member Management ---
@Post(':id/members')
@HttpCode(HttpStatus.CREATED)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
addMember(
  @Request() req,
  @Param('id', ParseIntPipe) teamId: number,
  @Body() addMemberDto: AddMemberDto
): Promise<TeamMembership> { // Return the created membership info
    // Service handles leader check and adding member
    return this.teamsService.addMember(req.user.userId, teamId, addMemberDto);
}

@Delete(':id/members/:memberId')
@HttpCode(HttpStatus.NO_CONTENT)
removeMember(
  @Request() req,
  @Param('id', ParseIntPipe) teamId: number,
  @Param('memberId', ParseIntPipe) memberIdToRemove: number
): Promise<void> {
     // Service handles leader check and removing member
     return this.teamsService.removeMember(req.user.userId, teamId, memberIdToRemove);
}

@Get(':id/members') // Endpoint to get members list
getTeamMembers(
    @Request() req,
    @Param('id', ParseIntPipe) teamId: number
): Promise<TeamMembershipInfo[]> { // Use specific DTO for return type
     // Service handles check that requester is member
     return this.teamsService.getTeamMembers(req.user.userId, teamId);
}

}