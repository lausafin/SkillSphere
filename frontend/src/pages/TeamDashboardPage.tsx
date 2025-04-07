// src/pages/TeamDashboardPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, CircularProgress, Alert as MuiAlert, AlertProps, Paper, Grid, Breadcrumbs, Link as MuiLink, Divider,
    List, ListItem, ListItemText, IconButton, Tooltip, Chip, Snackbar, Button // Keep Button import
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';

import { useAuth } from '../context/AuthContext';

// Import specific DTOs needed from API service
import {
    TeamDashboardDto,
    TeamDashboardMemberDto,
    MemberSkillHistoryDto,
    MemberSkillHistoryPointDto,
    TeamRole,
    TeamDashboardSkillDto,
    fetchTeamDashboardDataAPI as fetchTeamDashboardData,
    fetchMemberSkillHistoryAPI as fetchMemberSkillHistory,
    removeTeamMember
} from '../services/api';
import SkillRadarChart from '../components/SkillRadarChart';
// Import chart AND its data type
import MultiSkillProgressChart, { MultiProgressChartDataPoint } from '../components/MultiSkillProgressChart';
import AddMemberForm from '../components/AddMemberForm';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

// Custom Alert for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Define the type for the state holding the dashboard data
// Imported TeamDashboardDto which serves this purpose

const TeamDashboardPage: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const { user } = useAuth();

    const [teamData, setTeamData] = useState<TeamDashboardDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // History Toggle State
    const [activeMemberHistoryId, setActiveMemberHistoryId] = useState<number | null>(null);
    const [memberHistoryData, setMemberHistoryData] = useState<MemberSkillHistoryDto | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    // Member Management State
    const [membersList, setMembersList] = useState<TeamDashboardMemberDto[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [deletingMember, setDeletingMember] = useState<TeamDashboardMemberDto | null>(null);

    // Snackbar State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

    // --- Calculate User Role ---
    const currentUserRole = useMemo(() => {
        if (!user || !teamData) return null;
        const memberInfo = teamData.members.find(m => m.id === user.id);
        return memberInfo?.role ?? null;
    }, [user, teamData]);

    const isLeader = currentUserRole === TeamRole.LEADER;

    // --- Snackbar Handler ---
    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // --- Data Fetching Callbacks ---
    const loadDashboardData = useCallback(async (id: number) => {
        if (!teamData) setIsLoading(true); // Only set initial loading true
        setError(null);
        try {
            const data = await fetchTeamDashboardData(id);
            setTeamData(data);
            setMembersList(data.members || []);
        } catch (err: any) { console.error("Fetch dash err:", err); setError(err.response?.data?.message || 'Could not load team dashboard.'); }
        finally { setIsLoading(false); }
    }, [teamData]);

    // --- Initial Data Load ---
    useEffect(() => {
        let isMounted = true;
        if (!teamId) { setError("Team ID missing."); setIsLoading(false); return; }
        const id = teamId ? parseInt(teamId, 10) : NaN;
        if (isNaN(id)) { setError("Invalid Team ID."); setIsLoading(false); return; }

        let currentError: string | null = null; // Use local variable for error setting

        fetchTeamDashboardData(id)
            .then(data => { if (isMounted) { setTeamData(data); setMembersList(data.members || []); }})
            .catch(err => { if (isMounted) { console.error("Fetch dash err:", err); currentError = err.response?.data?.message || 'Could not load team dashboard.'; setError(currentError); } })
            .finally(() => { if (isMounted) setIsLoading(false); });

        return () => { isMounted = false; };
    }, [teamId, loadDashboardData]); // Rerun if teamId changes

    // --- History Fetch Effect ---
    useEffect(() => {
        let isMounted = true;
        if (!activeMemberHistoryId || !teamId) { setMemberHistoryData(null); return; }
        const currentTeamId = teamId ? parseInt(teamId, 10) : NaN;
        if (isNaN(currentTeamId)) return;

        setIsLoadingHistory(true); setHistoryError(null); setMemberHistoryData(null);
        fetchMemberSkillHistory(currentTeamId, activeMemberHistoryId)
            .then(data => { if (isMounted) setMemberHistoryData(data); })
            .catch(err => { if (isMounted) { console.error("Fetch history err:", err); setHistoryError(err.response?.data?.message || 'Could not load member history.'); } })
            .finally(() => { if (isMounted) setIsLoadingHistory(false); });

        return () => { isMounted = false; };
    }, [activeMemberHistoryId, teamId]);


    // --- Member Management Handlers ---
    const handleMemberAdded = () => {
        setShowAddMember(false);
        setSnackbar({ open: true, message: 'Member added successfully!', severity: 'success' });
        if (teamId) loadDashboardData(parseInt(teamId, 10));
    };
    const handleDeleteMemberRequest = (member: TeamDashboardMemberDto) => setDeletingMember(member);
    const handleCancelDeleteMember = () => setDeletingMember(null);
    const handleConfirmDeleteMember = async () => {
        if (!deletingMember || !teamId) return;
        const { id: idToRemove, name: nameToRemove, email: emailToRemove } = deletingMember;
        const currentTeamId = parseInt(teamId, 10);
        if (isNaN(currentTeamId)) return;
        setDeletingMember(null);
        try {
            await removeTeamMember(currentTeamId, idToRemove);
            setSnackbar({ open: true, message: `Member "${nameToRemove || emailToRemove}" removed.`, severity: 'success' });
            loadDashboardData(currentTeamId);
        } catch (err: any) {
            console.error("Remove member error:", err);
            setSnackbar({ open: true, message: `Error removing member: ${err.response?.data?.message || 'Server error'}`, severity: 'error' });
        }
    };

    // --- Prepare Radar Data ---
    const getRadarDataForMember = useCallback((memberId: number): { subject: string; score: number; fullMark: number }[] => {
        if (!teamData || !teamData.teamSkills || teamData.teamSkills.length < 3) return [];
        const memberScoreData = teamData.memberScores.find(ms => ms.memberId === memberId);
        if (!memberScoreData) return [];
        const skillsToShow = teamData.teamSkills.slice(0, 7);

        return skillsToShow.map((skill: TeamDashboardSkillDto) => {
            const scoreInfo = memberScoreData.scores[skill.id];
            // --- Access currentScore property ---
            const currentScore = scoreInfo?.currentScore;
            // --- END Access currentScore ---
            return {
                subject: skill.name,
                score: (currentScore !== null && currentScore !== undefined && skill.maxScore > 0)
                    ? Math.round((currentScore / skill.maxScore) * 100) // Use currentScore
                    : 0,
                fullMark: 100,
            };
        });
    }, [teamData]);

     // --- Prepare Line Chart Data ---
     const activeMemberLineChartData = useMemo(() => {
         if (!memberHistoryData || !teamData || !teamData.teamSkills || memberHistoryData.history.length < 2) {
            return { data: [], keys: [] };
         }
         const includedSkillNames = memberHistoryData.skillIds
               .map((id: number) => teamData.teamSkills.find((s: TeamDashboardSkillDto) => s.id === id)?.name)
               .filter((name): name is string => !!name);

         const transformedData = memberHistoryData.history.map((point: MemberSkillHistoryPointDto) => {
             const dataPoint: MultiProgressChartDataPoint = { timestamp: point.timestamp, dateLabel: point.dateLabel };
             includedSkillNames.forEach((skillName: string, index: number) => {
                  const skillId = memberHistoryData.skillIds[index];
                  dataPoint[skillName] = point.scores ? (point.scores[skillId] ?? null) : null;
             });
             return dataPoint;
         });

        console.log(`Line Data: Final processed data for member ${activeMemberHistoryId}:`, JSON.stringify(transformedData)); // Log final array
        return { data: transformedData, keys: includedSkillNames };
    }, [memberHistoryData, teamData]);

    // --- Toggle Handler ---
    const handleChartToggle = (memberId: number) => {
        setActiveMemberHistoryId(prevId => (prevId === memberId ? null : memberId));
    };

    // --- Render Logic ---
    if (isLoading && !teamData) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!teamData) return <Typography sx={{ m: 3 }}>Team data not found or could not be loaded.</Typography>;
    

    return (
        <>
            <Box sx={{ p: 3 }}>
                 {/* Breadcrumbs - Added 'to' prop */}
                 <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
                     <MuiLink component={RouterLink} underline="hover" color="inherit" to="/teams"> Teams </MuiLink>
                     <Typography color="text.primary">{teamData.teamName}</Typography>
                 </Breadcrumbs>
                {/* Header */}
                <Typography variant="h4" gutterBottom> Team Dashboard: {teamData.teamName} </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom> Owner: {teamData.owner.name || teamData.owner.email} </Typography>
                {/* Add Member Button */}
                {isLeader && !showAddMember && ( <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setShowAddMember(true)} sx={{ my: 1 }}> Add Member </Button> )}

                {/* Add Member Form */}
                {isLeader && showAddMember && ( <Paper elevation={1} sx={{ p: 2, my: 2 }}> <Box display="flex" justifyContent="space-between" alignItems="center"> <Typography variant="h6">Add New Member</Typography> <IconButton onClick={() => setShowAddMember(false)} size="small"><CloseIcon/></IconButton> </Box> <AddMemberForm teamId={teamData.teamId} onMemberAdded={handleMemberAdded} /> </Paper> )}

                <Divider sx={{ my: 2 }} />

                {/* Member List */}
                 <Typography variant="h5" gutterBottom>Members ({membersList.length})</Typography>
                 <Paper elevation={1} sx={{ mb: 3 }}>
                    <List dense>
                        {membersList.map((member: TeamDashboardMemberDto) => (
                             <ListItem
                                key={member.id}
                                secondaryAction={
                                    isLeader && user?.id !== member.id && teamData.owner.id !== member.id ? (
                                        <Tooltip title="Remove Member">
                                            <IconButton edge="end" onClick={() => handleDeleteMemberRequest(member)} color="error" size="small">
                                                <DeleteIcon fontSize="inherit"/>
                                            </IconButton>
                                        </Tooltip>
                                     ) : null
                                }
                                sx={{pr: isLeader && user?.id !== member.id && teamData.owner.id !== member.id ? 6 : 2}}
                                disablePadding // Looks better with custom content layout
                             >
                                 {/* Use ListItemText with primary prop containing Box for layout */}
                                 <ListItemText
                                     primary={
                                         <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                                             <Typography component="span" variant="body1" sx={{ flexGrow: 1 }}>
                                                 {member.name || member.email}
                                             </Typography>
                                             {/* Chips go inside the Box, pushed right */}
                                             {member.id === teamData.owner.id && <Chip label="Owner" size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />}
                                             {member.id === user?.id && <Chip label="You" size="small" variant="outlined" sx={{ ml: 1 }} />}
                                         </Box>
                                     }
                                     secondary={member.role} // Role as secondary text
                                 />
                             </ListItem>
                        ))}
                        {membersList.length === 0 && <ListItem><ListItemText primary="No members found."/></ListItem>}
                    </List>
                </Paper>

                 {/* Charts Section */}
                <Typography variant="h5" gutterBottom>Member Skill Snapshots</Typography>
                <Typography variant="body2" color="textSecondary" sx={{mb: 2}}> Click chart to view progress history (Normalized % for top 7 skills). </Typography>
                <Grid container spacing={3}>
                    {membersList.map((member: TeamDashboardMemberDto) => (
                        <Grid item xs={12} sm={6} md={4} key={member.id}>
                            <Paper elevation={activeMemberHistoryId === member.id ? 6 : 2} sx={{ transition: 'box-shadow 0.3s' }}>
                                 {activeMemberHistoryId === member.id ? (
                                     <Box sx={{ p: 1, cursor: 'pointer', minHeight: 380 }} onClick={() => handleChartToggle(member.id)}>
                                          {isLoadingHistory && <CircularProgress size={20} sx={{m: 2}}/>}
                                          {historyError && <MuiAlert severity="warning" sx={{m: 1}}>{historyError}</MuiAlert>}
                                         {memberHistoryData && !isLoadingHistory && !historyError && (
                                            <MultiSkillProgressChart data={activeMemberLineChartData.data} skillKeys={activeMemberLineChartData.keys} title={`${member.name || member.email}'s Progress (%)`}/>
                                         )}
                                          {memberHistoryData && memberHistoryData.history.length < 2 && !isLoadingHistory && !historyError && ( <Typography color="textSecondary" sx={{ textAlign: 'center', p: 2 }}>Not enough history data for line chart.</Typography> )}
                                          {!memberHistoryData && !isLoadingHistory && !historyError && ( <Typography color="textSecondary" sx={{ textAlign: 'center', p: 2 }}>Could not load history data.</Typography> )}
                                     </Box>
                                 ) : (
                                     <Box sx={{ p: 1, cursor: 'pointer', minHeight: 380 }} onClick={() => handleChartToggle(member.id)}>
                                        
                                         <SkillRadarChart data={getRadarDataForMember(member.id)} title={`${member.name || member.email}'s Snapshot (%)`} />
                                     </Box>
                                 )}
                             </Paper>
                        </Grid>
                    ))}
                     {membersList.length === 0 && ( <Grid item xs={12}> <Typography color="textSecondary" sx={{textAlign: 'center'}}>No members to display charts for.</Typography> </Grid> )}
                </Grid>
            </Box>

             {/* Delete Member Confirmation */}
             <DeleteConfirmationDialog open={!!deletingMember} onClose={handleCancelDeleteMember} onConfirm={handleConfirmDeleteMember} itemName={deletingMember?.name || deletingMember?.email || ''} itemType="team member" />

              {/* Snackbar */}
             <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                 <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}> {snackbar.message} </Alert>
             </Snackbar>
        </>
    );
};

export default TeamDashboardPage;