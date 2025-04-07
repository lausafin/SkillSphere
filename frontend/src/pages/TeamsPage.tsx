// src/pages/TeamsPage.tsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText,
    Paper, Divider, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { fetchUserTeams, deleteTeam, UserTeamListItem } from '../services/api'; // Import Team types/functions
import CreateTeamModal from '../components/CreateTeamModal'; // Ensure this path is correct
// import UpdateTeamModal from '../components/UpdateTeamModal'; // Create later if needed
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog'; // Reuse

const TeamsPage: React.FC = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState<UserTeamListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingTeam, setDeletingTeam] = useState<UserTeamListItem | null>(null);
    // Add state for editing modal later if needed
    // const [editingTeam, setEditingTeam] = useState<UserTeamListItem | null>(null);

    const loadTeams = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await fetchUserTeams();
            setTeams(data);
        } catch (err: any) {
            console.error("Failed to fetch teams:", err);
            setError(err.response?.data?.message || 'Could not load your teams.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTeams();
    }, [loadTeams]);

    // --- Modal Handlers ---
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = (created?: boolean) => {
        setIsCreateModalOpen(false);
        if (created) loadTeams(); // Refresh list if a team was added
    };

    // --- Delete Handlers ---
    const handleDeleteRequest = (team: UserTeamListItem) => setDeletingTeam(team);
    const handleCancelDelete = () => setDeletingTeam(null);
    const handleConfirmDelete = async () => {
        if (!deletingTeam) return;
        const idToDelete = deletingTeam.id;
        const nameToDelete = deletingTeam.name;
        setDeletingTeam(null);
        try {
            await deleteTeam(idToDelete);
            // Optionally show snackbar success
            alert(`Team "${nameToDelete}" deleted.`); // Simple feedback for now
            loadTeams(); // Refresh the list
        } catch (err: any) {
             console.error("Failed to delete team:", err);
             // Optionally show snackbar error
             alert(`Error deleting team: ${err.response?.data?.message || 'Server error'}`);
        }
    };

    // --- TODO: Edit Handlers ---
    // const handleOpenEditModal = (team: UserTeamListItem) => setEditingTeam(team);
    // const handleCloseEditModal = (updated?: boolean) => { setEditingTeam(null); if (updated) loadTeams(); };

    return (
        <>
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                    <Typography variant="h4" component="h1">My Teams</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
                        Create New Team
                    </Button>
                </Box>

                {isLoading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
                    <Paper elevation={2}>
                        <List>
                            {teams.length === 0 && (
                                <ListItem>
                                    <ListItemText primary="You are not currently a member of any teams." secondary="Click 'Create New Team' to start one."/>
                                </ListItem>
                            )}
                            {teams.map((team, index) => (
                                <React.Fragment key={team.id}>
                                    {index > 0 && <Divider component="li" />}
                                    <ListItem
                                        secondaryAction={
                                            // Show edit/delete only if current user is the owner
                                            user?.id === team.ownerId ? (
                                                <>
                                                     {/* <Tooltip title="Edit Team Name">
                                                         <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }} onClick={() => handleOpenEditModal(team)}> <EditIcon /> </IconButton>
                                                     </Tooltip> */}
                                                     <Tooltip title="Delete Team">
                                                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRequest(team)} color="error"> <DeleteIcon /> </IconButton>
                                                     </Tooltip>
                                                </>
                                            ) : null // Or show a 'Leave Team' button later?
                                        }
                                    >
                                        <ListItemText
                                            primary={team.name}
                                            secondary={`Owner: ${team.owner.name || team.owner.email}${user?.id === team.ownerId ? ' (You)' : ''}`}
                                        />
                                        {/* Display role if available from API */}
                                        {/* {team.currentUserRole && <Chip label={team.currentUserRole} size="small" sx={{ml: 2}}/>} */}
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            {/* --- Modals --- */}
            <CreateTeamModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
            {/* <UpdateTeamModal open={!!editingTeam} onClose={handleCloseEditModal} team={editingTeam} /> */}
            <DeleteConfirmationDialog
                 open={!!deletingTeam}
                 onClose={handleCancelDelete}
                 onConfirm={handleConfirmDelete}
                 itemName={deletingTeam?.name || ''}
                 itemType="team"
            />

            {/* Temporary placeholder for create modal */}
            {isCreateModalOpen && <Alert severity="info">Create Team Modal Placeholder</Alert>}
        </>
    );
};

export default TeamsPage;