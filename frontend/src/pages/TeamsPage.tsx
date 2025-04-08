// src/pages/TeamsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert as MuiAlert, AlertProps, List, ListItem, ListItemText,
    Paper, Divider, IconButton, Tooltip, Chip, Snackbar // Added Snackbar and MuiAlert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// import EditIcon from '@mui/icons-material/Edit'; // Keep commented for now
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group'; // Icon for teams
import PersonIcon from '@mui/icons-material/Person'; // Icon for owner
import { useNavigate } from 'react-router-dom'; // For navigating to team details

import { useAuth } from '../context/AuthContext';
import { fetchUserTeams, deleteTeam, UserTeamListItem } from '../services/api'; // Import TeamRole if using it for display later
import CreateTeamModal from '../components/CreateTeamModal'; // Assuming this exists now
// import UpdateTeamModal from '../components/UpdateTeamModal'; // Create later if needed
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog'; // Reuse

// Custom Alert for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const TeamsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<UserTeamListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingTeam, setDeletingTeam] = useState<UserTeamListItem | null>(null);
    // const [editingTeam, setEditingTeam] = useState<UserTeamListItem | null>(null); // State for editing modal later

    // --- Snackbar State ---
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

    // --- Snackbar Handler ---
    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // --- Data Loading ---
    const loadTeams = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await fetchUserTeams();
            // Sort teams: owned first, then alphabetically
            data.sort((a, b) => {
                const userIsOwnerA = a.ownerId === user?.id;
                const userIsOwnerB = b.ownerId === user?.id;
                if (userIsOwnerA && !userIsOwnerB) return -1;
                if (!userIsOwnerA && userIsOwnerB) return 1;
                return a.name.localeCompare(b.name);
            });
            setTeams(data);
        } catch (err: any) {
            console.error("Failed to fetch teams:", err);
            setError(err.response?.data?.message || 'Could not load your teams.');
            // Optionally show snackbar error for fetch failure too
            // setSnackbar({ open: true, message: 'Could not load teams.', severity: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]); // Depend on userId for sorting logic

    useEffect(() => {
        loadTeams();
    }, [loadTeams]);

    // --- Modal Handlers ---
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = (created?: boolean) => {
        setIsCreateModalOpen(false);
        if (created) {
            setSnackbar({ open: true, message: 'Team created successfully!', severity: 'success' }); // Use Snackbar
            loadTeams(); // Refresh list if a team was added
        }
    };

    // --- Delete Handlers ---
    const handleDeleteRequest = (team: UserTeamListItem) => {
        setDeletingTeam(team);
    };
    const handleCancelDelete = () => {
        setDeletingTeam(null);
    };
    const handleConfirmDelete = async () => {
        if (!deletingTeam) return;
        const idToDelete = deletingTeam.id;
        const nameToDelete = deletingTeam.name;
        setDeletingTeam(null); // Close dialog state first
        try {
            await deleteTeam(idToDelete);
            setSnackbar({ open: true, message: `Team "${nameToDelete}" deleted.`, severity: 'success' }); // Use Snackbar
            loadTeams(); // Refresh the list
        } catch (err: any) {
             console.error("Failed to delete team:", err);
             setSnackbar({ open: true, message: `Error deleting team: ${err.response?.data?.message || 'Server error'}`, severity: 'error' }); // Use Snackbar
        }
    };

     // --- Navigation ---
     const handleViewTeam = (teamId: number) => {
        navigate(`/teams/${teamId}`); // Navigate to the detail/dashboard page
     };

    // --- TODO: Edit Handlers ---
    // const handleOpenEditModal = (team: UserTeamListItem) => setEditingTeam(team);
    // const handleCloseEditModal = (updated?: boolean) => { setEditingTeam(null); if (updated) loadTeams(); };

    // --- Render ---
    return (
        <>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                    <Typography variant="h4" component="h1">My Teams</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
                        Create New Team
                    </Button>
                </Box>

                {/* Loading / Error / Content */}
                {isLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />
                 : error ? <MuiAlert severity="error">{error}</MuiAlert> // Use MuiAlert for fetch error
                 : (
                    <Paper elevation={2}>
                        <List>
                            {/* Empty State */}
                            {teams.length === 0 && (
                                <ListItem>
                                    <ListItemText primary="You are not currently a member of any teams." secondary="Click 'Create New Team' to start one."/>
                                </ListItem>
                            )}
                            {/* Team List Items */}
                            {teams.map((team, index) => {
                                const isOwner = user?.id === team.ownerId;
                                return (
                                    <React.Fragment key={team.id}>
                                        {index > 0 && <Divider component="li" variant="inset" />}
                                        <ListItem
                                            button // Make item look clickable
                                            onClick={() => handleViewTeam(team.id)} // Navigate on click
                                            secondaryAction={
                                                // Show delete only if current user is the owner
                                                isOwner ? (
                                                    <Tooltip title="Delete Team">
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="delete"
                                                            // --- FIXED: Added event propagation stop ---
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // PREVENT BUBBLING TO LISTITEM
                                                                handleDeleteRequest(team);
                                                            }}
                                                            // --- END FIX ---
                                                            color="error"
                                                            size="small" // Consistent button size
                                                        >
                                                            <DeleteIcon fontSize='small' />
                                                        </IconButton>
                                                     </Tooltip>
                                                ) : null // No actions for non-owners currently
                                            }
                                            sx={{pr: isOwner ? 6 : 2}} // Adjust padding if actions present
                                            disablePadding
                                        >
                                            {/* Icon indicating ownership */}
                                            <Tooltip title={isOwner ? "You own this team" : "You are a member"}>
                                                {/* IconButton wrapper makes tooltip work better on icon */}
                                                <IconButton edge="start" sx={{ mr: 1 }} aria-label="team-ownership" disableRipple size="small">
                                                    {isOwner ? <PersonIcon color="primary" fontSize='small'/> : <GroupIcon color="action" fontSize='small'/>}
                                                </IconButton>
                                            </Tooltip>
                                             {/* Wrap primary content in Box for proper layout with chips */}
                                             <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, mr: isOwner ? 1 : 0 /* Add margin if delete button present */ }}>
                                                <ListItemText
                                                    primary={team.name}
                                                    secondary={`Owner: ${team.owner?.name || team.owner?.email || 'N/A'}`}
                                                />
                                                {/* Display role if available - requires backend changes */}
                                                {/* {team.currentUserRole && team.currentUserRole !== 'OWNER' && <Chip label={team.currentUserRole} size="small" sx={{ml: 'auto'}}/>} */}
                                                {isOwner && <Chip label="Owner" size="small" color="primary" variant="outlined" sx={{ml: 'auto'}}/>}
                                                {/* Optional: 'You' chip if needed, check ID */}
                                                {/* {user?.id === team.ownerId && <Chip label="You (Owner)" size="small" sx={{ml: 1}}/>} */}
                                            </Box>
                                        </ListItem>
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </Paper>
                )}
            </Box>

            {/* --- Modals & Snackbar --- */}
            <CreateTeamModal
                open={isCreateModalOpen}
                onClose={handleCloseCreateModal}
            />
            <DeleteConfirmationDialog
                 open={!!deletingTeam}
                 onClose={handleCancelDelete}
                 onConfirm={handleConfirmDelete}
                 itemName={deletingTeam?.name || ''}
                 itemType="team"
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {/* Use the custom Alert component for Snackbar */}
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default TeamsPage;