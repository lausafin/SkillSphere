// src/tags/tags.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tag } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds all unique tags created by or associated with a specific user.
   * Based on the schema, tags have a direct userId link.
   * @param userId The ID of the user whose tags are to be fetched.
   * @returns A promise that resolves to an array of Tag objects, ordered by name.
   */
  async findAll(userId: number): Promise<Tag[]> {
    try {
      return await this.prisma.tag.findMany({
        where: {
          userId: userId, // Fetch tags directly linked to the user
        },
        orderBy: {
          name: 'asc', // Order alphabetically for consistent frontend display
        },
        // No need to include skills here, just the tag list itself
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      // Depending on error handling strategy, you might throw a specific error
      throw new Error('Could not fetch tags.');
    }
  }

  // --- Potential Future Methods (Not strictly required for V1 based on implicit creation) ---

  /*
  // Find a specific tag by ID, ensuring ownership (useful if updating/deleting tags)
  async findOne(userId: number, id: number): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag || tag.userId !== userId) {
        return null;
    }
    return tag;
  }
  */

  /*
  // Delete a tag *only* if it's not associated with any skills (more complex)
  async remove(userId: number, id: number): Promise<void> {
    const tag = await this.findOne(userId, id); // Check ownership
    if (!tag) {
       throw new NotFoundException(`Tag with ID ${id} not found or access denied.`);
    }

    // Check if the tag is linked to any skills via SkillTag join table
    const linkedSkillsCount = await this.prisma.skillTag.count({
        where: { tagId: id }
    });

    if (linkedSkillsCount > 0) {
        throw new ForbiddenException(`Cannot delete tag "${tag.name}" as it is linked to ${linkedSkillsCount} skill(s).`);
    }

    // Proceed with deletion if not linked
    await this.prisma.tag.delete({ where: { id } });
  }
  */
}