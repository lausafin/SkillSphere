// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert as MuiAlert, AlertProps, Button, List, ListItem, ListItemText // Keep required MUI imports
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import types and functions from api service
import {
    fetchSkills,
    SkillData, // Main data type for skills list
    SkillProgressSummaryDto, // Type for the history summary endpoint response
    fetchSkillProgressSummary // API function for history summary
} from '../services/api';
import SkillRadarChart from '../components/SkillRadarChart';
import CategoryPieChart from '../components/CategoryPieChart'; // Keep Pie Chart import
import MultiSkillProgressChart from '../components/MultiSkillProgressChart'; // Keep Multi chart import
// Import type needed for processing history data, ensure it's exported from chart component
import type { MultiProgressChartDataPoint } from '../components/MultiSkillProgressChart';
// Import type needed from API for history data structure
import { SkillProgressHistoryPointScoresDto } from '../services/api'; // Import necessary sub-types


// Custom Alert for potential future use
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [skills, setSkills] = useState<SkillData[]>([]); // For summary cards/list
    const [skillProgressData, setSkillProgressData] = useState<SkillProgressSummaryDto | null>(null); // For multi-line chart
    const [isLoading, setIsLoading] = useState(true); // Combined loading state
    const [error, setError] = useState<string | null>(null);

    // --- Fetch ALL Dashboard Data ---
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true); setError(null);
        setSkills([]); setSkillProgressData(null); // Reset data

        Promise.all([
            fetchSkills(), // Fetches SkillData[] (includes latestScoreData)
            fetchSkillProgressSummary() // Fetches SkillProgressSummaryDto
        ]).then(([skillsData, progressData]) => {
            if (isMounted) {
                setSkills(skillsData);
                setSkillProgressData(progressData);
            }
        }).catch(err => {
            if (isMounted) {
                console.error("Failed to load dashboard data:", err);
                setError(err.response?.data?.message || 'Failed to load dashboard data.');
            }
        }).finally(() => {
            if (isMounted) setIsLoading(false);
        });

        return () => { isMounted = false; }; // Cleanup
    }, []); // Fetch only on mount

    // --- Prepare data for Radar Chart ---
    const radarChartData = useMemo(() => {
        if (!skills || skills.length < 3) return [];
        const sortedSkills = [...skills].sort((a, b) =>
            new Date(b.latestScoreData?.timestamp || b.updatedAt).getTime() -
            new Date(a.latestScoreData?.timestamp || a.updatedAt).getTime()
        );
        const skillsForChart = sortedSkills.slice(0, 7);
        if (skillsForChart.length < 3) return [];
        return skillsForChart.map(skill => ({
            subject: skill.name,
            score: skill.latestScoreData?.score ?? 0,
            fullMark: skill.maxScore,
        }));
    }, [skills]);

    // --- Prepare data for Pie Chart (Category Distribution) ---
    const categoryPieChartData = useMemo(() => {
        if (!skills || skills.length === 0) return [];
        const counts: { [key: string]: number } = {};
        let uncategorizedCount = 0;
        skills.forEach(skill => {
            if (skill.category?.name) { counts[skill.category.name] = (counts[skill.category.name] || 0) + 1; }
            else { uncategorizedCount++; }
        });
        const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));
        if (uncategorizedCount > 0) { pieData.push({ name: 'Uncategorized', value: uncategorizedCount }); }
        pieData.sort((a, b) => b.value - a.value);
        return pieData;
    }, [skills]);

    // --- Prepare data for Multi-Skill Line Chart ---
    const multiSkillChartProcessedData = useMemo(() => {
        // Use the data fetched from the dedicated summary endpoint
        if (!skillProgressData || !skillProgressData.history || skillProgressData.history.length < 2) {
            return { data: [], keys: [] };
        }

        // Extract skill names (keys) using the skillNames map from the summary
        const skillKeys = Object.values(skillProgressData.skillNames);
        const skillIdNameMap = skillProgressData.skillNames; // { skillId: skillName }

        // Transform history points
        const transformedData = (skillProgressData.history as unknown as SkillProgressHistoryPointScoresDto[]).map((point) => {
            const dataPoint: MultiProgressChartDataPoint = {
                timestamp: point.timestamp ?? 0,
                dateLabel: String(point.dateLabel ?? ''),
            };
            // Use the skillNames map to populate scores correctly
            for (const skillIdStr in skillIdNameMap) {
                const skillName = skillIdNameMap[skillIdStr];
                // Use string skillId for accessing scores object keys
                dataPoint[skillName] = point.scores && typeof point.scores === 'object' ? (point.scores[skillIdStr as keyof typeof point.scores] ?? null) : null;
            }
            return dataPoint;
        });

        return { data: transformedData, keys: skillKeys }; // Return processed data and skill names
    }, [skillProgressData]); // Depend only on the fetched progress summary data


    // --- Other calculations ---
    const totalSkills = skills.length;
    const averageScore = totalSkills > 0 ? (skills.reduce((sum, skill) => {
            const score = skill.latestScoreData?.score;
            const max = skill.maxScore > 0 ? skill.maxScore : 1;
            return sum + ((score ?? 0) / max);
        }, 0) / totalSkills * 10)
        : 0;
    const recentlyUpdated = [...skills].sort((a, b) =>
        new Date(b.latestScoreData?.timestamp || b.updatedAt).getTime() -
        new Date(a.latestScoreData?.timestamp || a.updatedAt).getTime()
    ).slice(0, 5);

     // --- Render ---
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom> Welcome back, {user?.name || user?.email}! </Typography>

            {isLoading ? <CircularProgress sx={{ display: 'block', margin: 'auto' }} /> : error ? <Alert severity="error">{error}</Alert> : (
                <Grid container spacing={3}>
                    {/* --- Row 1: Summary & Recent --- */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                             <Typography variant="h6">Total Skills</Typography>
                             <Typography variant="h3">{totalSkills}</Typography>
                             <Button component={RouterLink} to="/skills" size="small" sx={{mt: 1}}>View All Skills</Button>
                         </Paper>
                     </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                            <Typography variant="h6">Average Score</Typography>
                            <Typography variant="h3">{averageScore.toFixed(1)} / 10</Typography>
                            <Typography variant="body2" color="textSecondary">(Based on latest log %)</Typography>
                        </Paper>
                    </Grid>
                     <Grid item xs={12} md={4}>
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <Typography variant="h6" gutterBottom>Recently Updated</Typography>
                             {recentlyUpdated.length === 0 ? <Typography color="textSecondary">No skills tracked yet.</Typography> : (
                                 <List dense> {recentlyUpdated.map(skill => (
                                     <ListItem key={skill.id} disablePadding>
                                         <ListItemText primary={skill.name} secondary={`Score: ${skill.latestScoreData?.score ?? '--'}/${skill.maxScore}`} />
                                     </ListItem> ))}
                                 </List>
                             )}
                         </Paper>
                     </Grid>

                    {/* --- Row 2: Pie & Radar --- */}
                     <Grid item xs={12} md={6}> {/* Pie Chart */}
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                            <CategoryPieChart data={categoryPieChartData} title="Skills by Category" />
                         </Paper>
                     </Grid>
                     <Grid item xs={12} md={6}> {/* Radar Chart */}
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <SkillRadarChart data={radarChartData} title="Recent Skill Snapshot (Score)" />
                         </Paper>
                     </Grid>

                     {/* --- Row 3: Multi-Skill Progress --- */}
                     <Grid item xs={12}> {/* Full width */}
                         <Paper elevation={2} sx={{ p: 2, minHeight: 350, display: 'flex', flexDirection: 'column' }}>
                             <MultiSkillProgressChart
                                 data={multiSkillChartProcessedData.data} // Use processed data
                                 skillKeys={multiSkillChartProcessedData.keys} // Use processed keys
                                 title="Personal Skill Progress Over Last Year (%)"
                             />
                             {/* Updated condition to check fetched data */}
                             {(!skillProgressData || multiSkillChartProcessedData.data.length === 0) && !isLoading && (
                                <Typography color="textSecondary" sx={{textAlign: 'center', p:2, mt: 2}}>
                                    Not enough progress history found for personal skills in the last year.
                                </Typography>
                             )}
                         </Paper>
                     </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default DashboardPage;