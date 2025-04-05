// src/tags/tags.controller.ts
import {
    Controller,
    Get,
    UseGuards,
    Request,
    InternalServerErrorException,
    // Delete, Param, ParseIntPipe, HttpCode, HttpStatus // Keep commented if delete not implemented yet
  } from '@nestjs/common';
  import { TagsService } from './tags.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { Tag } from '@prisma/client';
  
  @Controller('api/tags') // Base route: /api/tags
  @UseGuards(JwtAuthGuard) // Protect all routes in this controller
  export class TagsController {
    constructor(private readonly tagsService: TagsService) {}
  
    /**
     * GET /api/tags
     * Retrieves all unique tags associated with the authenticated user.
     * Used primarily for populating dropdowns/autocomplete fields in the frontend.
     */
    @Get()
    async findAll(@Request() req): Promise<Tag[]> {
      try {
        const userId = req.user.userId; // Assumes userId is in the JWT payload via JwtStrategy
        return await this.tagsService.findAll(userId);
      } catch (error) {
        // Log the error internally
        console.error(`Failed to get tags for user ${req.user?.userId}:`, error);
        // Return a generic error to the client
        throw new InternalServerErrorException('An error occurred while fetching tags.');
      }
    }
  
    /*
    // DELETE /api/tags/:id (Optional: Uncomment if deletion service method is implemented)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
        const userId = req.user.userId;
        // Service method should handle NotFoundException and ForbiddenException
        await this.tagsService.remove(userId, id);
    }
    */
  }