// src/components/SkillCard.tsx
import React from 'react';
import {
    Card, CardContent, Typography, Box, LinearProgress, IconButton, Chip, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group'; // Icon for team skills

// Import the main SkillData interface, assuming it's exported from api.ts or a shared types file
// This SkillData should NOT have currentScore, but SHOULD have optional latestScoreData
import { SkillData } from '../services/api'; // Adjust path if needed

interface SkillCardProps {
    skill: SkillData;
    onEdit?: (skillId: number) => void; // Optional: Passed only if user has permission
    onDelete?: (skillId: number, skillName: string) => void; // Optional: Passed only if user has permission
    onViewHistory?: (skillId: number) => void; // Optional: Allow disabling if needed, but usually available
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onEdit, onDelete, onViewHistory }) => {
    // --- Get score and timestamp from latestScoreData (provided by backend findAll/findOne) ---
    const currentScore = skill.latestScoreData?.score ?? null; // Use latest score, default null
    const progressPercentage = (currentScore !== null && skill.maxScore > 0)
        ? (currentScore / skill.maxScore) * 100
        : 0;

    // Determine display timestamp (latest log or skill update time)
    const displayTimestamp = skill.latestScoreData?.timestamp || skill.updatedAt;
    // Format the date string or show 'N/A'
    const lastActivityDate = displayTimestamp
        ? new Date(displayTimestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A';
    // Determine the label for the date
    const dateLabel = skill.latestScoreData?.timestamp ? 'Last score:' : 'Updated:';
    // --- End Score/Date Logic ---

    // --- Event Handlers ---
    const handleEditClick = () => {
        if (onEdit) onEdit(skill.id);
    };

    const handleDeleteClick = () => {
        if (onDelete) onDelete(skill.id, skill.name);
    };

    const handleHistoryClick = () => {
        if (onViewHistory) onViewHistory(skill.id);
    };
    // --- End Handlers ---

    const isTeamSkill = !!skill.team;

    return (
        <Card variant="outlined" sx={{ mb: 2, position: 'relative', height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* --- Top Section: Info & Actions --- */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    {/* Skill Info */}
                    <Box sx={{ pr: (onEdit || onDelete || onViewHistory) ? '40px' : '10px' /* Less padding if no actions */ }}>
                        <Typography variant="h6" component="div" gutterBottom>
                            {skill.name}
                        </Typography>

                        {/* Team Chip */}
                        {isTeamSkill && skill.team && (
                             <Chip icon={<GroupIcon fontSize="small" />} label={`Team: ${skill.team.name}`} size="small" variant="outlined" color="secondary" sx={{ mr: 0.5, mb: 0.5 }} />
                        )}
                        {/* Category Chip */}
                        {skill.category && ( <Chip label={skill.category.name} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} /> )}
                        {/* Tags Chips */}
                        {skill.tags?.map(({ tag }) => ( <Chip key={tag.id} label={`#${tag.name}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} /> ))}
                        {/* Description */}
                        {skill.description && ( <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, wordBreak: 'break-word' }}> {skill.description} </Typography> )}
                    </Box>

                    {/* Action Buttons (Top Right) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, position: 'absolute', top: 8, right: 8 }}>
                        {/* History button always shown if handler exists */}
                        {onViewHistory && (
                             <Tooltip title="View Progress History">
                                <IconButton size="small" onClick={handleHistoryClick} aria-label={`View history for ${skill.name}`}> <HistoryIcon fontSize="small" /> </IconButton>
                             </Tooltip>
                        )}
                         {/* Edit button only shown if handler exists (permission granted) */}
                        {onEdit && (
                            <Tooltip title="Edit Skill">
                                <IconButton size="small" onClick={handleEditClick} aria-label={`Edit ${skill.name}`}> <EditIcon fontSize="small" /> </IconButton>
                            </Tooltip>
                        )}
                         {/* Delete button only shown if handler exists (permission granted) */}
                         {onDelete && (
                             <Tooltip title="Delete Skill">
                                <IconButton size="small" onClick={handleDeleteClick} color="error" aria-label={`Delete ${skill.name}`}> <DeleteIcon fontSize="small" /> </IconButton>
                            </Tooltip>
                         )}
                    </Box>
                </Box>

                {/* Spacer to push progress to bottom */}
                 <Box sx={{ flexGrow: 1 }} />

                {/* --- Progress Section (Bottom) --- */}
                {skill.ratingScaleType === 'numeric' && (
                    <Box mt={1}> {/* Add margin top for spacing */}
                        {/* Score Text */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                             <Typography variant="body2" color="text.secondary">
                                 Current Score:
                             </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {/* Display latest score or placeholder */}
                                {currentScore !== null ? `${currentScore} / ${skill.maxScore}` : `-- / ${skill.maxScore}`}
                            </Typography>
                        </Box>
                        {/* Progress Bar */}
                        <LinearProgress
                             variant="determinate"
                             value={progressPercentage}
                             sx={{ height: 8, borderRadius: 4, mb: 0.5 }} // Add margin bottom
                         />
                         {/* Last Activity Date */}
                         <Typography variant="caption" display="block" color="text.secondary" sx={{ textAlign: 'right'}}>
                             {`${dateLabel} ${lastActivityDate}`}
                         </Typography>
                    </Box>
                )}
                 {/* Add rendering for other ratingScaleTypes if needed */}

            </CardContent>
        </Card>
    );
};

// Define related types directly or import if needed by SkillData definition above
// interface ProgressLogData { id: number; timestamp: string; score: number; notes?: string | null; timeSpentMinutes?: number | null; }
// interface BasicUser { id: number; name?: string | null; }
// interface BasicTeam { id: number; name: string; }

export default SkillCard;