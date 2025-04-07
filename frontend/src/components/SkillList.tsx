// src/components/SkillList.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert as MuiAlert, AlertProps, Button, Grid, Snackbar, TextField,
    Select, MenuItem, FormControl, InputLabel, Paper, IconButton, Tooltip, ListSubheader, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';

import SkillCard, { SkillData } from './SkillCard';
import { fetchSkills, deleteSkill, fetchCategories, fetchTags, fetchUserTeams, UserTeamListItem, TeamRole } from '../services/api';
import AddEditSkillModal from './AddEditSkillModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ViewHistoryModal from './ViewHistoryModal';
import { useAuth } from '../context/AuthContext';

// Custom Alert for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

const SkillList: React.FC = () => {
    const { user } = useAuth();
    const [allSkills, setAllSkills] = useState<SkillData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
    const [historySkill, setHistorySkill] = useState<SkillData | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [deletingSkillInfo, setDeletingSkillInfo] = useState<{ id: number; name: string } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [selectedTagId, setSelectedTagId] = useState<number | ''>('');
    const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'score'>('updatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [userTeams, setUserTeams] = useState<UserTeamListItem[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);

    // --- Map for User Roles ---
    const userRolesMap = useMemo(() => {
        const map = new Map<number, TeamRole>();
        userTeams.forEach(team => map.set(team.id, team.currentUserRole));
        return map;
    }, [userTeams]);

    // --- Fetch Initial Data ---
    const loadInitialData = useCallback(async () => {
        setIsLoading(true); setLoadingFilters(true); setError(null);
        try {
            const [skillData, categoryData, tagData, teamData] = await Promise.all([ fetchSkills(), fetchCategories(), fetchTags(), fetchUserTeams() ]);
            setAllSkills(skillData); setCategories(categoryData); setTags(tagData); setUserTeams(teamData);
        } catch (err: any) { /* ... error handling ... */ }
        finally { setIsLoading(false); setLoadingFilters(false); }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    // --- Refresh Data ---
    const refreshData = useCallback(async () => { await loadInitialData(); }, [loadInitialData]);

    // --- Filtering/Sorting (remains same) ---
    // --- Filtering and Sorting Logic ---
    const filteredAndSortedSkills = useMemo(() => {
        let filtered = [...allSkills];

        // 1. Ownership Filter
        if (selectedOwnerFilter === 'personal') { /* ... */ }
        else if (selectedOwnerFilter.startsWith('team-')) { /* ... */ }

        // 2. Search Term
        if (searchTerm) { /* ... */ }

        // 3. Category
        if (selectedCategoryId !== '') { /* ... */ }

        // 4. Tag
        if (selectedTagId !== '') { /* ... */ }

        // 5. Sorting
        filtered.sort((a: SkillData, b: SkillData) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name) * (sortDirection === 'asc' ? 1 : -1);
            } else if (sortBy === 'score') {
                return (a.currentScore - b.currentScore) * (sortDirection === 'asc' ? 1 : -1);
            } else { // Default to 'updatedAt'
                return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * (sortDirection === 'asc' ? 1 : -1);
            }
        });

        // --- ENSURE THIS RETURN IS PRESENT AND REACHABLE ---
        return filtered;
        // --- END ENSURE ---

    }, [allSkills, searchTerm, selectedCategoryId, selectedTagId, sortBy, sortDirection, selectedOwnerFilter, user?.id]);

    // --- Handlers (remain same, use refreshData) ---
    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => { if (reason === 'clickaway') return; setSnackbar(prev => ({ ...prev, open: false })); };
    const handleOpenAddModal = () => { setEditingSkillId(null); setIsAddEditModalOpen(true); };
    const handleOpenEditModal = (skillId: number) => { setEditingSkillId(skillId); setIsAddEditModalOpen(true); };
    const handleCloseAddEditModal = (refresh?: boolean) => { setIsAddEditModalOpen(false); setEditingSkillId(null); if (refresh) { setSnackbar({ open: true, message: `Skill ${editingSkillId ? 'updated' : 'added'} successfully!`, severity: 'success' }); refreshData();} };
    const handleDeleteRequest = (skillId: number, skillName: string) => { setDeletingSkillInfo({ id: skillId, name: skillName }); setIsDeleteDialogOpen(true); };
    const handleConfirmDelete = async () => { if (!deletingSkillInfo) return; const { id, name } = deletingSkillInfo; setIsDeleteDialogOpen(false); try { await deleteSkill(id); setSnackbar({ open: true, message: `Skill "${name}" deleted.`, severity: 'success' }); refreshData();} catch (err: any) { console.error("Delete Skill Err:", err); setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete skill.', severity: 'error' }); } finally { setDeletingSkillInfo(null); }};
    const handleCancelDelete = () => { setIsDeleteDialogOpen(false); setDeletingSkillInfo(null); };
    const handleViewHistory = (skillId: number) => { const skill = allSkills.find(s => s.id === skillId); if(skill) { setHistorySkill(skill); setIsHistoryModalOpen(true); } };
    const handleCloseHistoryModal = (refresh?: boolean) => { setIsHistoryModalOpen(false); setHistorySkill(null); if (refresh) { refreshData();} };
    // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
    // const handleCategoryChange = (e: any) => setSelectedCategoryId(e.target.value as number | '');
    // const handleTagChange = (e: any) => setSelectedTagId(e.target.value as number | '');
    const handleOwnerFilterChange = (e: any) => setSelectedOwnerFilter(e.target.value as string);
    // const handleSortChange = (e: any) => setSortBy(e.target.value as 'updatedAt' | 'name' | 'score');
    const toggleSortDirection = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    const clearFilters = () => { setSearchTerm(''); setSelectedCategoryId(''); setSelectedTagId(''); setSelectedOwnerFilter('all'); setSortBy('updatedAt'); setSortDirection('desc'); };

    // --- Render ---
    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
             {/* Header */}
             <Box display="flex" /* ... */ > <Typography variant="h4">My Skills</Typography> <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add Skill</Button> </Box>
             {/* Filters */}
             <Paper elevation={1} sx={{ p: 2, mb: 3 }}> <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3} lg={2}> <TextField size="small" fullWidth label="Search" value={searchTerm} /*...*/ /> </Grid>
                <Grid item xs={12} sm={6} md={3} lg={2}> <FormControl size="small" fullWidth disabled={loadingFilters}> <InputLabel>Ownership</InputLabel> <Select value={selectedOwnerFilter} label="Ownership" onChange={handleOwnerFilterChange}> <MenuItem value="all">All</MenuItem> <MenuItem value="personal">Personal</MenuItem> <Divider /> <ListSubheader>Teams</ListSubheader> {userTeams.length === 0 && <MenuItem disabled>No teams</MenuItem>} {userTeams.map(t => <MenuItem key={t.id} value={`team-${t.id}`}>{t.name}</MenuItem>)} </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={3} md={2} lg={2}> <FormControl size="small" fullWidth disabled={loadingFilters}> <InputLabel>Category</InputLabel> <Select value={selectedCategoryId} /*...*/ > <MenuItem value=""><em>All</em></MenuItem> {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)} </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={3} md={2} lg={2}> <FormControl size="small" fullWidth disabled={loadingFilters}> <InputLabel>Tag</InputLabel> <Select value={selectedTagId} /*...*/ > <MenuItem value=""><em>All</em></MenuItem> {tags.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)} </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={4} md={2} lg={2}> <FormControl size="small" fullWidth> <InputLabel>Sort By</InputLabel> <Select value={sortBy} /*...*/ > <MenuItem value="updatedAt">Updated</MenuItem> <MenuItem value="name">Name</MenuItem> <MenuItem value="score">Score</MenuItem> </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={4} md={2} lg={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}> <Tooltip title={`Sort (${sortDirection})`}><IconButton onClick={toggleSortDirection} size="small"><SortIcon sx={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}/></IconButton></Tooltip> </Grid>
                <Grid item xs={12} sm={4} md={1} lg={1} sx={{textAlign: 'right'}}> <Tooltip title="Clear Filters"><IconButton onClick={clearFilters} size="small"><ClearIcon/></IconButton></Tooltip> </Grid>
             </Grid> </Paper>

            {/* Skill Grid */}
            {isLoading ? <CircularProgress /*...*/ />
            : error ? <Alert severity="error">{error}</Alert>
            : filteredAndSortedSkills.length === 0 ? ( <Typography /*...*/ > {allSkills.length === 0 ? 'No skills...' : 'No skills match...'} </Typography> )
            : ( <Grid container spacing={2}> {filteredAndSortedSkills.map((skill) => {
                        // --- Full Permission Logic ---
                        const isPersonal = !!skill.user?.id;
                        const isTeamSkill = !!skill.team;
                        const isOwner = isPersonal && skill.user?.id === user?.id;
                        const userRoleInTeam = isTeamSkill && skill.team?.id ? userRolesMap.get(skill.team.id) : null;
                        const canEdit = isOwner || (isTeamSkill && userRoleInTeam === TeamRole.LEADER);
                        const canDelete = isOwner || (isTeamSkill && userRoleInTeam === TeamRole.LEADER);
                        const canViewHistory = true; // Assume view allowed if skill is visible

                        return (
                            <Grid item xs={12} sm={6} md={4} key={skill.id}>
                                <SkillCard skill={skill} onEdit={canEdit ? handleOpenEditModal : undefined} onDelete={canDelete ? handleDeleteRequest : undefined} onViewHistory={canViewHistory ? handleViewHistory : undefined} />
                            </Grid> );
                    })} </Grid> )}

            {/* Modals & Snackbar */}
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