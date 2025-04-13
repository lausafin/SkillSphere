// src/skills/skills.controller.ts
import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request,
    ParseIntPipe, HttpCode, HttpStatus, NotFoundException, UsePipes, ValidationPipe
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Correct path
// Import the new DTO
import { SkillProgressSummaryDto } from './dto/skill-progress-summary.dto';

// Use actual DTO classes
interface CreateSkillDto { name: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }
interface UpdateSkillDto { name?: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }
interface CreateProgressLogDto { score: number; notes?: string; timeSpentMinutes?: number; timestamp?: Date; }

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
    constructor(private readonly skillsService: SkillsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    //@UsePipes(new ValidationPipe({ whitelist: true }))
    create(@Request() req, @Body() createSkillDto: CreateSkillDto) {
        return this.skillsService.create(req.user.userId, createSkillDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.skillsService.findAll(req.user.userId);
    }

    @Get(':id')
    async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
        const skill = await this.skillsService.findOne(req.user.userId, id);
        if (!skill) {
            throw new NotFoundException(`Skill with ID ${id} not found or access denied.`);
        }
        return skill;
    }

    @Patch(':id')
    //@UsePipes(new ValidationPipe({ whitelist: true }))
    update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateSkillDto: UpdateSkillDto) {
        return this.skillsService.update(req.user.userId, id, updateSkillDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
        await this.skillsService.remove(req.user.userId, id);
    }

    // --- Progress Log Endpoints ---

    @Post(':skillId/logs')
    @HttpCode(HttpStatus.CREATED)
    //@UsePipes(new ValidationPipe({ whitelist: true }))
    createProgressLog(
        @Request() req,
        @Param('skillId', ParseIntPipe) skillId: number,
        @Body() createLogDto: CreateProgressLogDto,
    ) {
        return this.skillsService.addProgressLog(req.user.userId, skillId, createLogDto);
    }

    @Get(':skillId/logs')
    findProgressLogs(
        @Request() req,
        @Param('skillId', ParseIntPipe) skillId: number,
    ) {
        return this.skillsService.getProgressLogs(req.user.userId, skillId);
    }

    // --- NEW Endpoint for Progress Summary ---
    @Get('progress-summary')
    getPersonalSkillProgressSummary(
        @Request() req
    ): Promise<SkillProgressSummaryDto> {
        // Service fetches data for the logged-in user
        return this.skillsService.getPersonalSkillProgressSummary(req.user.userId);
    }
    // --- END New Endpoint ---

}