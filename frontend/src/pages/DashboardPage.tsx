// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSkills } from '../services/api';
import { SkillData } from '../components/SkillCard'; // Import type

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [skills, setSkills] = useState<SkillData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true); setError(null);
        fetchSkills()
            .then(data => setSkills(data))
            .catch(err => { console.error(err); setError('Failed to load dashboard data.'); })
            .finally(() => setIsLoading(false));
    }, []);

    const totalSkills = skills.length;
    const averageScore = totalSkills > 0 ? (skills.reduce((sum, skill) => sum + (skill.maxScore > 0 ? (skill.currentScore / skill.maxScore) : 0), 0) / totalSkills * 10) : 0; // Avg % score out of 10

     const recentlyUpdated = [...skills].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5); // Get top 5 recent

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom> Welcome back, {user?.name || user?.email}! </Typography>

            {isLoading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
                <Grid container spacing={3}>
                    {/* Summary Cards */}
                    <Grid item xs={12} sm={6} md={4}> <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}> <Typography variant="h6">Total Skills</Typography> <Typography variant="h3">{totalSkills}</Typography> <Button component={RouterLink} to="/skills" size="small" sx={{mt: 1}}>View All Skills</Button> </Paper> </Grid>
                    <Grid item xs={12} sm={6} md={4}> <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}> <Typography variant="h6">Average Score</Typography> <Typography variant="h3">{averageScore.toFixed(1)} / 10</Typography> <Typography variant="body2" color="textSecondary">(Across all skills)</Typography> </Paper> </Grid>

                     {/* Recently Updated */}
                     <Grid item xs={12} md={4}>
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <Typography variant="h6" gutterBottom>Recently Updated</Typography>
                             {recentlyUpdated.length === 0 ? <Typography color="textSecondary">No skills updated yet.</Typography> : (
                                <List dense>
                                     {recentlyUpdated.map(skill => (
                                         <ListItem key={skill.id} disablePadding>
                                             <ListItemText primary={skill.name} secondary={`Score: ${skill.currentScore}/${skill.maxScore} - Updated: ${new Date(skill.updatedAt).toLocaleDateString()}`} />
                                         </ListItem>
                                     ))}
                                 </List>
                             )}
                         </Paper>
                     </Grid>

                      {/* Placeholder for Charts */}
                     {/* <Grid item xs={12} md={8}> <Paper elevation={2} sx={{ p: 2, height: '100%' }}> <Typography variant="h6">Activity Overview</Typography> <Typography color="textSecondary">(Charts coming soon...)</Typography> </Paper> </Grid> */}
                </Grid>
            )}
        </Box>
    );
};

// Need List imports for recently updated section
import { List, ListItem, ListItemText } from '@mui/material';

export default DashboardPage;