// src/components/SkillList.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert as MuiAlert, AlertProps, Button, Grid, Snackbar, TextField,
    Select, MenuItem, FormControl, InputLabel, Paper, IconButton, Tooltip, ListSubheader, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';

import SkillCard, { SkillData } from './SkillCard'; // Import SkillCard and updated SkillData type
import {
    fetchSkills, deleteSkill, fetchCategories, fetchTags, fetchUserTeams, UserTeamListItem, TeamRole // Import TeamRole
} from '../services/api';
import AddEditSkillModal from './AddEditSkillModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ViewHistoryModal from './ViewHistoryModal';
import { useAuth } from '../context/AuthContext';

// Custom Alert for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Define Category and Tag types locally if not imported globally
interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

const SkillList: React.FC = () => {
    const { user } = useAuth(); // Get current user info
    // --- State ---
    const [allSkills, setAllSkills] = useState<SkillData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Modals state...
    const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
    const [historySkill, setHistorySkill] = useState<SkillData | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [deletingSkillInfo, setDeletingSkillInfo] = useState<{ id: number; name: string } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    // Feedback State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    // Filters/Sort state...
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [selectedTagId, setSelectedTagId] = useState<number | ''>('');
    const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'score'>('updatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    // Filter data state...
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [userTeams, setUserTeams] = useState<UserTeamListItem[]>([]); // Includes currentUserRole
    const [loadingFilters, setLoadingFilters] = useState(false);


    // --- Map for User Roles in Teams ---
    const userRolesMap = useMemo(() => {
        const map = new Map<number, TeamRole>();
        userTeams.forEach(team => {
            // Ensure team.id and team.currentUserRole are valid before setting
            if (team && typeof team.id === 'number' && team.currentUserRole) {
                map.set(team.id, team.currentUserRole);
            }
        });
        return map;
    }, [userTeams]);

    // --- Fetch Initial Data ---
    const loadInitialData = useCallback(async () => {
        setIsLoading(true); setLoadingFilters(true); setError(null);
        try {
            const [skillData, categoryData, tagData, teamData] = await Promise.all([ fetchSkills(), fetchCategories(), fetchTags(), fetchUserTeams() ]);
            setAllSkills(skillData);
            setCategories(categoryData);
            setTags(tagData);
            setUserTeams(teamData);
        } catch (err: any) { console.error("Load Initial Err:", err); setError('Failed to load page data.'); setSnackbar({open: true, message: 'Error loading page data.', severity: 'error'}) }
        finally { setIsLoading(false); setLoadingFilters(false); }
    }, []); // Should have no dependency if only run once

    useEffect(() => { loadInitialData(); }, [loadInitialData]); // Run on mount

    // --- Refresh Data ---
    const refreshData = useCallback(async () => {
        // Optional: Set a specific refresh loading state?
        // setLoadingFilters(true); // Maybe also reload filters?
        setError(null);
        try {
            // Refetch skills and teams (roles might change if user is added/removed elsewhere)
            const [skillData, teamData] = await Promise.all([ fetchSkills(), fetchUserTeams() ]);
            setAllSkills(skillData);
            setUserTeams(teamData);
            // Optionally refetch categories/tags if they can change frequently
        } catch (err: any) { console.error("Refresh Err:", err); setError('Failed to refresh data.'); setSnackbar({open: true, message: 'Error refreshing data.', severity: 'error'}) }
        finally { setLoadingFilters(false); } // Ensure filter loading state reset
    }, []);


    // --- Filtering and Sorting Logic ---
    const filteredAndSortedSkills = useMemo(() => {
        let filtered = [...allSkills];

        // Ownership Filter
        if (selectedOwnerFilter === 'personal') { filtered = filtered.filter(skill => !!skill.user?.id && skill.user.id === user?.id); }
        else if (selectedOwnerFilter.startsWith('team-')) { const teamId = parseInt(selectedOwnerFilter.split('-')[1], 10); filtered = filtered.filter(skill => skill.team?.id === teamId); }
        // Search Term Filter
        if (searchTerm) { const lower = searchTerm.toLowerCase(); filtered = filtered.filter(s => s.name.toLowerCase().includes(lower) || s.description?.toLowerCase().includes(lower)); }
        // Category Filter
        if (selectedCategoryId !== '') { filtered = filtered.filter(skill => skill.category?.id === selectedCategoryId); }
        // Tag Filter
        if (selectedTagId !== '') { filtered = filtered.filter(skill => skill.tags?.some(({ tag }) => tag.id === selectedTagId)); }

        // 5. Sorting - Removed 'score' option
        filtered.sort((a: SkillData, b: SkillData) => {
            let compareA: any; let compareB: any;
            switch (sortBy) {
                case 'name': compareA = a.name.toLowerCase(); compareB = b.name.toLowerCase(); break;
                // case 'score': // REMOVED - No reliable score available here
                //     const scoreA = -1; // Placeholder
                //     const scoreB = -1;
                //     compareA = scoreA; compareB = scoreB;
                //     break;
                default: // 'updatedAt'
                     const timeA = new Date(a.updatedAt).getTime(); // Use updatedAt directly
                     const timeB = new Date(b.updatedAt).getTime();
                    compareA = timeA; compareB = timeB; break;
            }
            if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
             return a.name.localeCompare(b.name);
        });

        return filtered;
    }, [allSkills, searchTerm, selectedCategoryId, selectedTagId, sortBy, sortDirection, selectedOwnerFilter, user?.id]);


    // --- Handlers for Filters/Sort ---
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value);
    const handleCategoryChange = (event: any) => setSelectedCategoryId(event.target.value as number | '');
    const handleTagChange = (event: any) => setSelectedTagId(event.target.value as number | '');
    const handleOwnerFilterChange = (event: any) => setSelectedOwnerFilter(event.target.value as string);
    const handleSortChange = (event: any) => setSortBy(event.target.value as 'updatedAt' | 'name' | 'score');
    const toggleSortDirection = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    const clearFilters = () => { setSearchTerm(''); setSelectedCategoryId(''); setSelectedTagId(''); setSelectedOwnerFilter('all'); setSortBy('updatedAt'); setSortDirection('desc'); };

    // --- Snackbar Handler ---
    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => { if (reason === 'clickaway') return; setSnackbar(prev => ({ ...prev, open: false })); };

     // --- Modal/Delete/History Handlers (use refreshData) ---
    const handleOpenAddModal = () => { setEditingSkillId(null); setIsAddEditModalOpen(true); };
    const handleOpenEditModal = (skillId: number) => { setEditingSkillId(skillId); setIsAddEditModalOpen(true); };
    const handleCloseAddEditModal = (refresh?: boolean) => { setIsAddEditModalOpen(false); setEditingSkillId(null); if (refresh) { setSnackbar({ open: true, message: `Skill ${editingSkillId ? 'updated' : 'added'} successfully!`, severity: 'success' }); refreshData();} };
    const handleDeleteRequest = (skillId: number, skillName: string) => { setDeletingSkillInfo({ id: skillId, name: skillName }); setIsDeleteDialogOpen(true); };
    const handleConfirmDelete = async () => { if (!deletingSkillInfo) return; const { id, name } = deletingSkillInfo; setIsDeleteDialogOpen(false); try { await deleteSkill(id); setSnackbar({ open: true, message: `Skill "${name}" deleted.`, severity: 'success' }); refreshData();} catch (err: any) { console.error("Delete Skill Err:", err); setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete skill.', severity: 'error' }); } finally { setDeletingSkillInfo(null); }};
    const handleCancelDelete = () => { setIsDeleteDialogOpen(false); setDeletingSkillInfo(null); };
    const handleViewHistory = (skillId: number) => { const skill = allSkills.find(s => s.id === skillId); if(skill) { setHistorySkill(skill); setIsHistoryModalOpen(true); } };
    const handleCloseHistoryModal = (refresh?: boolean) => { setIsHistoryModalOpen(false); setHistorySkill(null); if (refresh) { refreshData();} };


    // --- Render Logic ---
    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
             {/* Header */}
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} /* Increased bottom margin */ flexWrap="wrap" gap={1}>
                 <Typography variant="h4" component="h1">My Skills</Typography>
                 <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}> Add Skill </Button>
             </Box>

            {/* Filter and Sort Controls */}
             <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                 <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3} lg={2}> <TextField variant="outlined" size="small" fullWidth label="Search" value={searchTerm} onChange={handleSearchChange} InputProps={{ endAdornment: searchTerm ? (<IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small"/></IconButton>) : <SearchIcon fontSize="small"/> }} /> </Grid>
                    <Grid item xs={12} sm={6} md={3} lg={2}> <FormControl variant="outlined" size="small" fullWidth disabled={loadingFilters}> <InputLabel>Ownership</InputLabel> <Select value={selectedOwnerFilter} label="Ownership" onChange={handleOwnerFilterChange}> <MenuItem value="all">All Skills</MenuItem> <MenuItem value="personal">My Personal</MenuItem> <Divider /> <ListSubheader>Teams</ListSubheader> {userTeams.length === 0 && <MenuItem disabled>No teams</MenuItem>} {userTeams.map(t => <MenuItem key={t.id} value={`team-${t.id}`}>{t.name}</MenuItem>)} </Select> </FormControl> </Grid>
                    <Grid item xs={6} sm={3} md={2} lg={2}> <FormControl variant="outlined" size="small" fullWidth disabled={loadingFilters}> <InputLabel>Category</InputLabel> <Select value={selectedCategoryId} label="Category" onChange={handleCategoryChange}> <MenuItem value=""><em>All</em></MenuItem> {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)} </Select> </FormControl> </Grid>
                    <Grid item xs={6} sm={3} md={2} lg={2}> <FormControl variant="outlined" size="small" fullWidth disabled={loadingFilters}> <InputLabel>Tag</InputLabel> <Select value={selectedTagId} label="Tag" onChange={handleTagChange}> <MenuItem value=""><em>All</em></MenuItem> {tags.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)} </Select> </FormControl> </Grid>
                    <Grid item xs={6} sm={4} md={2} lg={2}> <FormControl variant="outlined" size="small" fullWidth> <InputLabel>Sort By</InputLabel> <Select value={sortBy} label="Sort By" onChange={handleSortChange}> <MenuItem value="updatedAt">Updated</MenuItem> <MenuItem value="name">Name</MenuItem> <MenuItem value="score">Score</MenuItem> </Select> </FormControl> </Grid>
                    <Grid item xs={6} sm={4} md={2} lg={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}> <Tooltip title={`Sort Direction (${sortDirection})`}><IconButton onClick={toggleSortDirection} size="small" color="inherit"><SortIcon sx={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}/></IconButton></Tooltip> </Grid>
                    <Grid item xs={12} sm={4} md={1} lg={1} sx={{textAlign: 'right'}}> <Tooltip title="Clear Filters"><IconButton onClick={clearFilters} size="small" color="secondary"><ClearIcon/></IconButton></Tooltip> </Grid>
                 </Grid>
             </Paper>

            {/* Display Skills */}
            {isLoading ? <CircularProgress sx={{display: 'block', margin: 'auto', mt: 4}} />
            : error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            : filteredAndSortedSkills.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    {allSkills.length === 0 ? 'No skills added yet. Click "Add Skill"!' : 'No skills match the current filters.'}
                </Typography>
            ) : (
                <Grid container spacing={2}>
                    {filteredAndSortedSkills.map((skill) => {
                        // --- Full Permission Logic ---
                        const isPersonal = !!skill.user?.id;
                        const isTeamSkill = !!skill.team?.id;
                        const isOwner = isPersonal && skill.user?.id === user?.id;
                        const userRoleInTeam = isTeamSkill && skill.team?.id ? userRolesMap.get(skill.team.id) : null;
                        const canEdit = isOwner || (isTeamSkill && userRoleInTeam === TeamRole.LEADER);
                        const canDelete = isOwner || (isTeamSkill && userRoleInTeam === TeamRole.LEADER);
                        const canViewHistory = true; // Assume view allowed if skill is visible

                        return (
                            <Grid item xs={12} sm={6} md={4} key={skill.id}>
                                <SkillCard
                                    skill={skill} // Pass the SkillData object which now includes latestScore
                                    onEdit={canEdit ? handleOpenEditModal : undefined}
                                    onDelete={canDelete ? handleDeleteRequest : undefined}
                                    onViewHistory={canViewHistory ? handleViewHistory : undefined}
                                />
                            </Grid> );
                    })}
                </Grid>
            )}

            {/* --- Modals & Snackbar --- */}
            <AddEditSkillModal open={isAddEditModalOpen} onClose={handleCloseAddEditModal} skillIdToEdit={editingSkillId} />
            <DeleteConfirmationDialog open={isDeleteDialogOpen} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} itemName={deletingSkillInfo?.name || ''} itemType="skill" />
            <ViewHistoryModal open={isHistoryModalOpen} onClose={handleCloseHistoryModal} skillId={historySkill?.id ?? null} skillName={historySkill?.name} maxScore={historySkill?.maxScore} />
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}> {snackbar.message} </Alert>
            </Snackbar>
        </Box>
    );
};

export default SkillList;