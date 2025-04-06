// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Button, List, ListItem, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSkills } from '../services/api';
import { SkillData } from '../components/SkillCard';
import SkillRadarChart from '../components/SkillRadarChart'; // Import the new chart component

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [skills, setSkills] = useState<SkillData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { /* ... Same data fetching ... */
        setIsLoading(true); setError(null);
        fetchSkills()
            .then(data => setSkills(data))
            .catch(err => { console.error(err); setError('Failed to load dashboard data.'); })
            .finally(() => setIsLoading(false));
    }, []);

    // --- Prepare data for Radar Chart ---
    // Example: Use top 5-7 most recently updated skills for the chart
    const radarChartData = useMemo(() => {
        if (!skills || skills.length === 0) return [];

        const sortedSkills = [...skills].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const skillsForChart = sortedSkills.slice(0, 7); // Take up to 7 most recent

        // Need at least 3 points for a radar chart
        if (skillsForChart.length < 3) return [];

        return skillsForChart.map(skill => ({
            subject: skill.name, // Skill name as the axis label
            score: skill.currentScore, // Value for the data series
            fullMark: skill.maxScore, // Max value for this specific axis
        }));
    }, [skills]); // Recalculate only when skills data changes

    // --- Other calculations ---
    const totalSkills = skills.length;
    const averageScore = totalSkills > 0 ? (skills.reduce((sum, skill) => sum + (skill.maxScore > 0 ? (skill.currentScore / skill.maxScore) : 0), 0) / totalSkills * 10) : 0;
    const recentlyUpdated = skills.slice(0, 5); // Assuming skills are already sorted by updatedAt desc from API/filter logic

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom> Welcome back, {user?.name || user?.email}! </Typography>

            {isLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto' }} /> : error ? <Alert severity="error">{error}</Alert> : (
                <Grid container spacing={3}>
                    {/* Summary Cards */}
                    <Grid item xs={12} sm={6} md={4}> <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}> <Typography variant="h6">Total Skills</Typography> <Typography variant="h3">{totalSkills}</Typography> <Button component={RouterLink} to="/skills" size="small" sx={{mt: 1}}>View All Skills</Button> </Paper> </Grid>
                    <Grid item xs={12} sm={6} md={4}> <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}> <Typography variant="h6">Average Score</Typography> <Typography variant="h3">{averageScore.toFixed(1)} / 10</Typography> <Typography variant="body2" color="textSecondary">(Across all skills)</Typography> </Paper> </Grid>

                     {/* Recently Updated List */}
                     <Grid item xs={12} md={4}>
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <Typography variant="h6" gutterBottom>Recently Updated</Typography>
                             {recentlyUpdated.length === 0 ? <Typography color="textSecondary">No skills tracked yet.</Typography> : ( <List dense> {recentlyUpdated.map(skill => ( <ListItem key={skill.id} disablePadding> <ListItemText primary={skill.name} secondary={`Score: ${skill.currentScore}/${skill.maxScore}`} /> </ListItem> ))} </List> )}
                         </Paper>
                     </Grid>

                    {/* NEW: Radar Chart */}
                     <Grid item xs={12} md={6}> {/* Adjust grid size as needed */}
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             {/* Pass the processed data to the chart component */}
                             <SkillRadarChart
                                data={radarChartData}
                                title="Recent Skill Snapshot"
                             />
                         </Paper>
                     </Grid>

                      {/* Placeholder for other charts/widgets */}
                     <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                           <Typography variant="h6">Category Overview</Typography>
                           <Typography color="textSecondary">(Pie chart coming soon...)</Typography>
                         </Paper>
                     </Grid>

                </Grid>
            )}
        </Box>
    );
};

export default DashboardPage;