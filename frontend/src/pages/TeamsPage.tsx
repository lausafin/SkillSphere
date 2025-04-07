// src/pages/TeamsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert as MuiAlert, List, ListItem, ListItemText,
    Paper, Snackbar // Added Snackbar
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert'; // Separate Alert import for Snackbar
import AddIcon from '@mui/icons-material/Add';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
// import GroupIcon from '@mui/icons-material/Group';
// import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { fetchUserTeams, deleteTeam, UserTeamListItem } from '../services/api';
import CreateTeamModal from '../components/CreateTeamModal';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

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
    // Snackbar State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

    // Snackbar Handler
    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const loadTeams = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await fetchUserTeams();
            data.sort((a, b) => a.name.localeCompare(b.name));
            setTeams(data);
        } catch (err: any) { /* ... error handling ... */ }
        finally { setIsLoading(false); }
    }, [user?.id]);

    useEffect(() => { loadTeams(); }, [loadTeams]);

    // --- Modal Handlers ---
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = (created?: boolean) => {
        setIsCreateModalOpen(false);
        if (created) {
            setSnackbar({ open: true, message: 'Team created successfully!', severity: 'success' });
            loadTeams();
        }
    };

    // --- Delete Handlers ---
    const handleDeleteRequest = (team: UserTeamListItem) => setDeletingTeam(team);
    const handleCancelDelete = () => setDeletingTeam(null);
    const handleConfirmDelete = async () => {
        if (!deletingTeam) return;
        const { id: idToDelete, name: nameToDelete } = deletingTeam;
        setDeletingTeam(null);
        try {
            await deleteTeam(idToDelete);
            setSnackbar({ open: true, message: `Team "${nameToDelete}" deleted.`, severity: 'success' });
            loadTeams();
        } catch (err: any) {
             console.error("Failed to delete team:", err);
             setSnackbar({ open: true, message: `Error deleting team: ${err.response?.data?.message || 'Server error'}`, severity: 'error' });
        }
    };

     // --- Navigation ---
     const handleViewTeam = (teamId: number) => navigate(`/teams/${teamId}`);

    // --- Render ---
    return (
        <>
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" /* ... */ >
                    <Typography variant="h4" component="h1">My Teams</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}> Create New Team </Button>
                </Box>

                {isLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto' }} />
                 : error ? <Alert severity="error">{error}</Alert>
                 : ( 
                     <Paper elevation={2}>
                         <List>
                             {teams.map((team) => (
                                <ListItem key={team.id} button onClick={() => handleViewTeam(team.id)}>
                                    <ListItemText primary={team.name} />
                                    <Button variant="outlined" color="error" onClick={() => handleDeleteRequest(team)}>Delete</Button>
                                </ListItem>
                             ))}
                         </List>
                     </Paper>
                 )}
            </Box>

            {/* --- Modals & Snackbar --- */}
            <CreateTeamModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
            <DeleteConfirmationDialog open={!!deletingTeam} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} itemName={deletingTeam?.name || ''} itemType="team" />
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}> {snackbar.message} </Alert>
            </Snackbar>
        </>
    );
};

export default TeamsPage;