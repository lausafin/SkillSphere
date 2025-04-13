// src/components/SkillCard.tsx
import React from 'react';
import { /* ... MUI imports ... */ Card, CardContent, Typography, Box, LinearProgress, IconButton, Chip, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group'; // Icon for team skills

// Define Log data structure (can also be defined globally or imported)
interface ProgressLogData {
    id: number;
    timestamp: string; // ISO Date string
    score: number;
    notes?: string | null;
    timeSpentMinutes?: number | null;
}

// Import basic User/Team types or define inline
interface BasicUser { id: number; name?: string | null; }
interface BasicTeam { id: number; name: string; /* owner?: BasicUser */ } // Keep team basic for card

export interface SkillData {
    id: number;
    name: string;
    description?: string | null;
    currentScore: number;
    maxScore: number;
    ratingScaleType: string;
    updatedAt: string; // ISO date string
    category?: { id: number; name: string } | null;
    tags?: { tag: { id: number; name: string } }[];
    progressLogs?: ProgressLogData[]; // Optional from previous step

    // --- ADD OWNERSHIP RELATIONS ---
    user?: BasicUser | null; // The user if it's a personal skill
    team?: BasicTeam | null; // The team if it's a team skill
    // --- Ensure backend includes these (with selected fields) ---
}

interface SkillCardProps {
    skill: SkillData;
    // Make edit/delete optional - they won't be passed if user doesn't have permission
    onEdit?: (skillId: number) => void;
    onDelete?: (skillId: number, skillName: string) => void;
    onViewHistory?: (skillId: number) => void; // Assume history is always viewable if skill is visible
}

const SkillCard: React.FC<SkillCardProps> = ({
    skill,
    onEdit, // Optional now
    onDelete, // Optional now
    onViewHistory,
}) => {
    // ... (progressPercentage, lastUpdated calculation) ...
     const progressPercentage = skill.maxScore > 0 ? (skill.currentScore / skill.maxScore) * 100 : 0;

     {/* Progress Section */}
     {skill.ratingScaleType === 'numeric' && (
         <Box>
             <LinearProgress variant="determinate" value={progressPercentage} />
             <Typography variant="caption" color="text.secondary">
                 {`Progress: ${progressPercentage.toFixed(1)}%`}
             </Typography>
         </Box>
     )}
    //  const lastUpdated = new Date(skill.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });


    const handleEditClick = () => {
        if (onEdit) onEdit(skill.id); // Only call if function exists
    };

    const handleDeleteClick = () => {
        if (onDelete) onDelete(skill.id, skill.name); // Only call if function exists
    };

    const handleHistoryClick = () => {
        if (onViewHistory) onViewHistory(skill.id);
    };

    const isTeamSkill = !!skill.team; // Check if team data exists

    return (
        <Card variant="outlined" sx={{ mb: 2, position: 'relative', height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    {/* Skill Info */}
                    <Box sx={{ pr: onEdit || onDelete ? '40px' : '10px' /* Less padding if no edit/delete */ }}>
                        <Typography variant="h6" component="div" gutterBottom>
                            {skill.name}
                        </Typography>

                        {/* --- Display Team Chip if applicable --- */}
                        {isTeamSkill && skill.team && (
                             <Chip
                                 icon={<GroupIcon fontSize="small" />}
                                 label={`Team: ${skill.team.name}`}
                                 size="small"
                                 variant="outlined"
                                 color="secondary" // Use secondary color for team chip?
                                 sx={{ mr: 0.5, mb: 0.5 }}
                             />
                        )}
                        {/* --- End Team Chip --- */}

                        {skill.category && ( <Chip label={skill.category.name} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} /> )}
                        {skill.tags?.map(({ tag }) => ( <Chip key={tag.id} label={`#${tag.name}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} /> ))}
                        {skill.description && ( <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, wordBreak: 'break-word' }}> {skill.description} </Typography> )}
                         {/* Optional: Display Author for personal skill? Usually not needed if list context is clear */}
                         {/* {!isTeamSkill && skill.user && ( <Typography variant="caption" color="text.secondary">Author: You</Typography> )} */}
                    </Box>

                    {/* Action Buttons (Absolutely positioned top-right) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, position: 'absolute', top: 8, right: 8 }}>
                        <Tooltip title="View Progress History">
                            <IconButton size="small" onClick={handleHistoryClick} aria-label={`View history for ${skill.name}`}> <HistoryIcon fontSize="small" /> </IconButton>
                        </Tooltip>
                        {/* --- Conditionally Render Edit/Delete --- */}
                        {onEdit && (
                            <Tooltip title="Edit Skill">
                                <IconButton size="small" onClick={handleEditClick} aria-label={`Edit ${skill.name}`}> <EditIcon fontSize="small" /> </IconButton>
                            </Tooltip>
                        )}
                         {onDelete && (
                             <Tooltip title="Delete Skill">
                                <IconButton size="small" onClick={handleDeleteClick} color="error" aria-label={`Delete ${skill.name}`}> <DeleteIcon fontSize="small" /> </IconButton>
                            </Tooltip>
                         )}
                         {/* --- End Conditional Render --- */}
                    </Box>
                </Box>

                 <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}

                {/* Progress Section */}
                {skill.ratingScaleType === 'numeric' && (
                    <Box>
                        <LinearProgress variant="determinate" value={progressPercentage} />
                        <Typography variant="caption" color="text.secondary">
                            {`Progress: ${progressPercentage.toFixed(1)}%`}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default SkillCard;

// Re-add ProgressLogData interface if not defined globally
interface ProgressLogData { id: number; timestamp: string; score: number; notes?: string | null; timeSpentMinutes?: number | null; }