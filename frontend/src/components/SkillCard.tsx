// src/components/SkillCard.tsx
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    IconButton,
    Chip,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History'; // For viewing progress log

// Define Log data structure (can also be defined globally or imported)
interface ProgressLogData {
    id: number;
    timestamp: string; // ISO Date string
    score: number;
    notes?: string | null;
    timeSpentMinutes?: number | null;
}

// Update SkillData interface
export interface SkillData {
    id: number;
    name: string;
    description?: string | null;
    currentScore: number;
    maxScore: number;
    ratingScaleType: string;
    updatedAt: string;
    category?: { id: number; name: string } | null;
    tags?: { tag: { id: number; name: string } }[];
    progressLogs?: ProgressLogData[]; // <-- ADD THIS LINE
}

interface SkillCardProps {
    skill: SkillData;
    onEdit: (skillId: number) => void; // Callback for edit action
    onDelete: (skillId: number, skillName: string) => void; // Callback for delete action
    onViewHistory: (skillId: number) => void; // Callback to view progress log
}

const SkillCard: React.FC<SkillCardProps> = ({
    skill,
    onEdit,
    onDelete,
    onViewHistory,
}) => {
    const progressPercentage =
        skill.maxScore > 0 ? (skill.currentScore / skill.maxScore) * 100 : 0;

    const handleEditClick = () => {
        onEdit(skill.id);
    };

    const handleDeleteClick = () => {
        onDelete(skill.id, skill.name);
    };

    const handleHistoryClick = () => {
        onViewHistory(skill.id);
    };

    // Format the last updated date for display
    const lastUpdated = new Date(skill.updatedAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return (
        <Card variant="outlined" sx={{ mb: 2, position: 'relative', height: '100%' /* Ensure cards have same height */ }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    {/* Skill Info */}
                    <Box sx={{ pr: '40px' /* Space for buttons */ }}>
                        <Typography variant="h6" component="div" gutterBottom>
                            {skill.name}
                        </Typography>
                        {skill.category && (
                             <Chip label={skill.category.name} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                        )}
                        {skill.tags?.map(({ tag }) => (
                             <Chip key={tag.id} label={`#${tag.name}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                        {skill.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, wordBreak: 'break-word' }}>
                                {skill.description}
                            </Typography>
                        )}
                    </Box>

                     {/* Action Buttons (Absolutely positioned top-right) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, position: 'absolute', top: 8, right: 8 }}>
                        <Tooltip title="View Progress History">
                             <IconButton size="small" onClick={handleHistoryClick} aria-label={`View history for ${skill.name}`}>
                                <HistoryIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Skill">
                            <IconButton size="small" onClick={handleEditClick} aria-label={`Edit ${skill.name}`}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                         <Tooltip title="Delete Skill">
                            <IconButton size="small" onClick={handleDeleteClick} color="error" aria-label={`Delete ${skill.name}`}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                 {/* Spacer to push progress bar and date down */}
                 <Box sx={{ flexGrow: 1 }} />

                {/* Progress Section */}
                {skill.ratingScaleType === 'numeric' && (
                    <Box mt={1}>
                        <Box display="flex" alignItems="center" >
                            <Box flexGrow={1} mr={1}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercentage}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {`${skill.currentScore} / ${skill.maxScore}`}
                            </Typography>
                        </Box>
                         <Typography variant="caption" display="block" color="text.secondary" sx={{mt: 0.5, textAlign: 'right'}}>
                             Last updated: {lastUpdated}
                         </Typography>
                    </Box>
                )}
                {/* Add rendering for other ratingScaleTypes if needed */}

            </CardContent>
        </Card>
    );
};

export default SkillCard;