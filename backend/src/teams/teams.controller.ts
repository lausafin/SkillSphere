// src/teams/teams.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus, UsePipes, ValidationPipe, ForbiddenException } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Correct path
// Assume DTO classes: CreateTeamDto, UpdateTeamDto
import { TeamDashboardDto } from './dto/team-dashboard.dto'; // Adjust import as necessary

interface CreateTeamDto { name: string; }
interface UpdateTeamDto { name?: string; }

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // @UsePipes(new ValidationPipe({ whitelist: true })) // Enable when DTO class exists
  create(@Request() req, @Body() createTeamDto: CreateTeamDto) {
    // userId from JWT payload attached by guard
    return this.teamsService.create(req.user.userId, createTeamDto);
  }

  @Get() // Get teams the current user is a member of
  findUserTeams(@Request() req) {
    return this.teamsService.findUserTeams(req.user.userId);
  }

  @Get(':id') // Get specific team details if user is a member
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    // Service method throws NotFoundException if not found or not a member
    return this.teamsService.findOne(req.user.userId, id);
  }

  @Patch(':id') // Update team name (requires ownership)
   // @UsePipes(new ValidationPipe({ whitelist: true }))
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateTeamDto: UpdateTeamDto) {
    // Service method throws ForbiddenException if not owner
    return this.teamsService.update(req.user.userId, id, updateTeamDto);
  }

  @Delete(':id') // Delete team (requires ownership)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
     // Service method throws ForbiddenException if not owner
    await this.teamsService.remove(req.user.userId, id);
  }

  // --- NEW Dashboard Endpoint ---
  @Get(':id/dashboard')
  getTeamDashboardData(
    @Request() req,
    @Param('id', ParseIntPipe) teamId: number
  ): Promise<TeamDashboardDto> {
      // Service method handles membership check & data aggregation
      return this.teamsService.getTeamDashboardData(req.user.userId, teamId);
  }

  // --- NEW Member Skill History Endpoint (Placeholder) ---
  // @Get(':id/members/:memberId/history')
  // getMemberSkillHistory(
  //     @Request() req,
  //     @Param('id', ParseIntPipe) teamId: number,
  //     @Param('memberId', ParseIntPipe) memberId: number,
  //     // @Query() queryParams: GetProgressSummaryDto // Add query params DTO later
  // ) {
  //     // return this.teamsService.getMemberSkillHistory(req.user.userId, teamId, memberId /*, queryParams */);
  // }

    // --- Member Management Endpoints (Placeholder) ---
    // ...
   // --- Member Management Endpoints (Placeholder - Add Later) ---
   // @Get(':id/members')
   // @Post(':id/members')
   // @Delete(':id/members/:userId')

}