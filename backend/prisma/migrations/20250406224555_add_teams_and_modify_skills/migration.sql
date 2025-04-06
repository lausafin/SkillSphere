/*
  Warnings:

  - A unique constraint covering the columns `[teamId,name]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `SkillProgressLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "teamId" INTEGER,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SkillProgressLog" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_ownerId_name_key" ON "Team"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_teamId_name_key" ON "Skill"("teamId", "name");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgressLog" ADD CONSTRAINT "SkillProgressLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
