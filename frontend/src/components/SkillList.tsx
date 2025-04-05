// src/components/SkillList.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Button, Grid, Snackbar, TextField,
    Select, MenuItem, FormControl, InputLabel, Paper, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort'; // For sort direction toggle

import SkillCard, { SkillData } from './SkillCard';
import { fetchSkills, deleteSkill, fetchCategories, fetchTags } from '../services/api';
import AddEditSkillModal from './AddEditSkillModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import ViewHistoryModal from './ViewHistoryModal';

// Define Category and Tag types
interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

const SkillList: React.FC = () => {
    const [allSkills, setAllSkills] = useState<SkillData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
    const [historySkill, setHistorySkill] = useState<SkillData | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [deletingSkillInfo, setDeletingSkillInfo] = useState<{ id: number; name: string } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [selectedTagId, setSelectedTagId] = useState<number | ''>('');
    const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'score'>('updatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);

    const loadInitialData = useCallback(async () => { /* ... Same as previous version ... */
        setIsLoading(true); setLoadingFilters(true); setError(null);
        try {
            const [skillData, categoryData, tagData] = await Promise.all([fetchSkills(), fetchCategories(), fetchTags()]);
            setAllSkills(skillData); setCategories(categoryData); setTags(tagData);
        } catch (err: any) { console.error("Data Load Err:", err); setError('Failed to load data.'); setSnackbar({ open: true, message: 'Error loading page data.', severity: 'error' }); }
        finally { setIsLoading(false); setLoadingFilters(false); }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const refreshSkills = useCallback(async () => { /* ... Same as previous version ... */
        // Maybe add subtle loading indicator for list only
        try { const data = await fetchSkills(); setAllSkills(data); }
        catch (err: any) { console.error("Refresh Err:", err); setSnackbar({ open: true, message: 'Failed to refresh skill list.', severity: 'error' }); }
    }, []);

    const filteredAndSortedSkills = useMemo(() => { /* ... Same as previous version ... */
        let filtered = [...allSkills];
        if (searchTerm) { const lower = searchTerm.toLowerCase(); filtered = filtered.filter(s => s.name.toLowerCase().includes(lower) || s.description?.toLowerCase().includes(lower)); }
        if (selectedCategoryId !== '') { filtered = filtered.filter(s => s.category?.id === selectedCategoryId); }
        if (selectedTagId !== '') { filtered = filtered.filter(s => s.tags?.some(({ tag }) => tag.id === selectedTagId)); }
        filtered.sort((a, b) => {
            let compareA: any, compareB: any;
            if (sortBy === 'name') { compareA = a.name.toLowerCase(); compareB = b.name.toLowerCase(); }
            else if (sortBy === 'score') { compareA = a.maxScore > 0 ? (a.currentScore / a.maxScore) : 0; compareB = b.maxScore > 0 ? (b.currentScore / b.maxScore) : 0; }
            else { compareA = new Date(a.updatedAt).getTime(); compareB = new Date(b.updatedAt).getTime(); }
            if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [allSkills, searchTerm, selectedCategoryId, selectedTagId, sortBy, sortDirection]);

    // --- Handlers ---
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
    const handleOpenAddModal = () => { setEditingSkillId(null); setIsAddEditModalOpen(true); };
    const handleOpenEditModal = (skillId: number) => { setEditingSkillId(skillId); setIsAddEditModalOpen(true); };
    const handleCloseAddEditModal = (refresh?: boolean) => { setIsAddEditModalOpen(false); setEditingSkillId(null); if (refresh) { setSnackbar({ open: true, message: `Skill ${editingSkillId ? 'updated' : 'added'}!`, severity: 'success' }); refreshSkills(); } };
    const handleDeleteRequest = (skillId: number, skillName: string) => { setDeletingSkillInfo({ id: skillId, name: skillName }); setIsDeleteDialogOpen(true); };
    const handleConfirmDelete = async () => { /* ... Same as previous version ... */
        if (!deletingSkillInfo) return; const { id, name } = deletingSkillInfo; setIsDeleteDialogOpen(false);
        try { await deleteSkill(id); setSnackbar({ open: true, message: `Skill "${name}" deleted.`, severity: 'success' }); refreshSkills(); }
        catch (err: any) { console.error("Delete Err:", err); setSnackbar({ open: true, message: 'Failed to delete skill.', severity: 'error' }); }
        finally { setDeletingSkillInfo(null); }
     };
    const handleCancelDelete = () => { setIsDeleteDialogOpen(false); setDeletingSkillInfo(null); };
    const handleViewHistory = (skillId: number) => { const skill = allSkills.find(s => s.id === skillId); if(skill) { setHistorySkill(skill); setIsHistoryModalOpen(true); } };
    const handleCloseHistoryModal = (refresh?: boolean) => { setIsHistoryModalOpen(false); setHistorySkill(null); if (refresh) { refreshSkills(); } };
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
    const handleCategoryChange = (e: any) => setSelectedCategoryId(e.target.value as number | '');
    const handleTagChange = (e: any) => setSelectedTagId(e.target.value as number | '');
    const handleSortChange = (e: any) => setSortBy(e.target.value as 'updatedAt' | 'name' | 'score');
    const toggleSortDirection = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    const clearFilters = () => { setSearchTerm(''); setSelectedCategoryId(''); setSelectedTagId(''); setSortBy('updatedAt'); setSortDirection('desc'); };


    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                 <Typography variant="h4" component="h1">My Skills</Typography>
                 <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add Skill</Button>
             </Box>

            {/* Filter/Sort Controls */}
             <Paper elevation={1} sx={{ p: 2, mb: 3 }}> <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}> <TextField fullWidth label="Search Skills" variant="outlined" size="small" value={searchTerm} onChange={handleSearchChange} InputProps={{ endAdornment: searchTerm ? (<IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small"/></IconButton>) : <SearchIcon fontSize="small"/> }} /> </Grid>
                <Grid item xs={6} sm={3} md={2}> <FormControl fullWidth size="small" disabled={loadingFilters}> <InputLabel>Category</InputLabel> <Select value={selectedCategoryId} label="Category" onChange={handleCategoryChange}> <MenuItem value=""><em>All</em></MenuItem> {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)} </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={3} md={2}> <FormControl fullWidth size="small" disabled={loadingFilters}> <InputLabel>Tag</InputLabel> <Select value={selectedTagId} label="Tag" onChange={handleTagChange}> <MenuItem value=""><em>All</em></MenuItem> {tags.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)} </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={4} md={2}> <FormControl fullWidth size="small"> <InputLabel>Sort By</InputLabel> <Select value={sortBy} label="Sort By" onChange={handleSortChange}> <MenuItem value="updatedAt">Updated</MenuItem> <MenuItem value="name">Name</MenuItem> <MenuItem value="score">Score</MenuItem> </Select> </FormControl> </Grid>
                <Grid item xs={6} sm={4} md={2}> <Tooltip title={`Sort Direction (${sortDirection})`}><Button fullWidth onClick={toggleSortDirection} size="small" variant="outlined" startIcon={<SortIcon sx={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}/>}> {sortDirection === 'asc' ? 'Asc' : 'Desc'} </Button></Tooltip> </Grid>
                <Grid item xs={12} sm={4} md={1} sx={{textAlign: 'right'}}> <Tooltip title="Clear Filters"><IconButton onClick={clearFilters} color="secondary"><ClearIcon/></IconButton></Tooltip> </Grid>
             </Grid> </Paper>

            {/* Skill Grid */}
            {isLoading ? <CircularProgress sx={{display: 'block', margin: 'auto'}} />
            : error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            : filteredAndSortedSkills.length === 0 ? ( <Typography sx={{ textAlign: 'center', mt: 4 }}> {allSkills.length === 0 ? 'No skills added yet. Click "Add Skill"!' : 'No skills match the current filters.'} </Typography> )
            : ( <Grid container spacing={2}> {filteredAndSortedSkills.map((skill) => (
                    <Grid item xs={12} sm={6} md={4} key={skill.id}>
                        <SkillCard skill={skill} onEdit={() => handleOpenEditModal(skill.id)} onDelete={() => handleDeleteRequest(skill.id, skill.name)} onViewHistory={() => handleViewHistory(skill.id)} />
                    </Grid> ))} </Grid> )}

            {/* Modals & Snackbar */}
            <AddEditSkillModal open={isAddEditModalOpen} onClose={handleCloseAddEditModal} skillIdToEdit={editingSkillId} />
            <DeleteConfirmationDialog open={isDeleteDialogOpen} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} itemName={deletingSkillInfo?.name || ''} itemType="skill" />
            <ViewHistoryModal open={isHistoryModalOpen} onClose={handleCloseHistoryModal} skillId={historySkill?.id ?? null} skillName={historySkill?.name} maxScore={historySkill?.maxScore} />
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled"> {snackbar.message} </Alert>
            </Snackbar>
        </Box>
    );
};

export default SkillList;