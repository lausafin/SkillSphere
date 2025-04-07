// src/pages/TeamsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText,
    Paper, Divider, IconButton, Tooltip, Chip // Added Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// import EditIcon from '@mui/icons-material/Edit'; // Keep commented for now
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group'; // Icon for teams
import PersonIcon from '@mui/icons-material/Person'; // Icon for owner
// import { useNavigate } from 'react-router-dom'; // For navigating to team details later

import { useAuth } from '../context/AuthContext';
import { fetchUserTeams, deleteTeam, UserTeamListItem } from '../services/api'; // Import Team types/functions
import CreateTeamModal from '../components/CreateTeamModal'; // Assuming this exists now
// import UpdateTeamModal from '../components/UpdateTeamModal';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

const TeamsPage: React.FC = () => {
    const { user } = useAuth();
    // const navigate = useNavigate();
    const [teams, setTeams] = useState<UserTeamListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingTeam, setDeletingTeam] = useState<UserTeamListItem | null>(null);
    // const [editingTeam, setEditingTeam] = useState<UserTeamListItem | null>(null);

    const loadTeams = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await fetchUserTeams();
            // Sort teams? Maybe owned first, then alphabetically?
            data.sort((a, b) => {
                if (a.ownerId === user?.id && b.ownerId !== user?.id) return -1; // Owned first
                if (a.ownerId !== user?.id && b.ownerId === user?.id) return 1;
                return a.name.localeCompare(b.name); // Then alphabetical
            });
            setTeams(data);
        } catch (err: any) {
            console.error("Failed to fetch teams:", err);
            setError(err.response?.data?.message || 'Could not load your teams.');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]); // Depend on userId to re-sort if user changes (unlikely mid-session)

    useEffect(() => {
        loadTeams();
    }, [loadTeams]);

    // --- Modal Handlers ---
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = (created?: boolean) => {
        setIsCreateModalOpen(false);
        if (created) loadTeams();
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
            alert(`Team "${nameToDelete}" deleted.`); // Simple feedback
            loadTeams(); // Refresh
        } catch (err: any) {
             console.error("Failed to delete team:", err);
             alert(`Error deleting team: ${err.response?.data?.message || 'Server error'}`);
        }
    };

     // --- Navigation ---
     const handleViewTeam = (teamId: number) => {
        // TODO: Navigate to a future Team Details page
        console.log(`Navigate to details for team ID: ${teamId}`);
        // navigate(`/teams/${teamId}/dashboard`); // Example future route
         alert(`Team Details/Dashboard page for ID ${teamId} not implemented yet.`);
     };

    // --- TODO: Edit Handlers ---

    return (
        <>
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                    <Typography variant="h4" component="h1">My Teams</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
                        Create New Team
                    </Button>
                </Box>

                {isLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto' }} />
                 : error ? <Alert severity="error">{error}</Alert>
                 : (
                    <Paper elevation={2}>
                        <List>
                            {teams.length === 0 && (
                                <ListItem>
                                    <ListItemText primary="You are not currently a member of any teams." secondary="Click 'Create New Team' to start one."/>
                                </ListItem>
                            )}
                            {teams.map((team, index) => {
                                const isOwner = user?.id === team.ownerId;
                                return (
                                    <React.Fragment key={team.id}>
                                        {index > 0 && <Divider component="li" variant="inset" />}
                                        <ListItem
                                            // Make list item clickable to view details (later)
                                            button // Add button attribute for hover effect & semantics
                                            onClick={() => handleViewTeam(team.id)} // Add onClick handler
                                            secondaryAction={
                                                // Show delete only if current user is the owner
                                                isOwner ? (
                                                    <Tooltip title="Delete Team">
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="delete"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(team); }} // Stop propagation so ListItem onClick doesn't fire
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                     </Tooltip>
                                                ) : null // No actions for non-owners for now
                                            }
                                        >
                                            <IconButton edge="start" sx={{ mr: 1 }} aria-label="team-type">
                                                {/* Show different icon if owner */}
                                                {isOwner ? <PersonIcon color="primary" titleAccess="You own this team"/> : <GroupIcon titleAccess="You are a member"/>}
                                            </IconButton>
                                            <ListItemText
                                                primary={team.name}
                                                secondary={`Owner: ${team.owner.name || team.owner.email}`}
                                            />
                                            {/* Display role if available - requires backend changes */}
                                            {/* {team.currentUserRole && <Chip label={team.currentUserRole} size="small" sx={{ml: 2}}/>} */}
                                            {isOwner && <Chip label="Owner" size="small" color="primary" variant="outlined" sx={{ml: 2}}/>}

                                        </ListItem>
                                    </React.Fragment>
                                );
                            })}
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
        </>
    );
};

export default TeamsPage;