// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert, Button, List, ListItem, ListItemText
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSkills } from '../services/api'; // Assuming fetchSkills exists
import { SkillData } from '../components/SkillCard'; // Base SkillData type
import SkillRadarChart from '../components/SkillRadarChart';
import CategoryPieChart from '../components/CategoryPieChart';
import MultiSkillProgressChart, { MultiProgressChartDataPoint } from '../components/MultiSkillProgressChart'; // Import multi-line chart and its data type

// Define Log data structure (mirroring backend or expected structure)
// This might need adjustment based on your actual SkillProgressLog model/API response
interface ProgressLogData {
    id: number;
    timestamp: string; // ISO Date string
    score: number;
    notes?: string | null;
    timeSpentMinutes?: number | null;
}

// *** IMPORTANT ASSUMPTION FOR SIMULATION: Assume SkillData now includes progressLogs ***
// This structure is likely NOT what fetchSkills returns by default and is INEFFICIENT.
// In a real app, use a dedicated backend endpoint for aggregated progress.
interface SkillDataWithLogs extends SkillData {
    progressLogs?: ProgressLogData[];
}


const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [skills, setSkills] = useState<SkillDataWithLogs[]>([]); // Use extended type
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true); setError(null);
        // *** SIMULATED FETCH - Replace with efficient method later ***
        fetchSkills() // Assume this fetches skills
            .then(data => {
                //  // Manually add dummy logs if fetchSkills doesn't return them (for testing chart only)
                //  // THIS IS VERY INEFFICIENT - DO NOT USE IN PRODUCTION
                //  // Replace this with a proper fetch for logs or aggregated data
                //  const skillsWithLogs = data.map(skill => ({
                //      ...skill,
                //      // Example: Add some dummy logs if none exist - REMOVE/REPLACE THIS
                //      progressLogs: skill.progressLogs && skill.progressLogs.length > 0 ? skill.progressLogs : [
                //          { id: Math.random(), score: skill.currentScore, timestamp: skill.updatedAt, notes: 'Current' },
                //          // Add more dummy past logs for testing? Ensure timestamps are valid ISO strings
                //           { id: Math.random(), score: Math.max(0, skill.currentScore - 2), timestamp: new Date(Date.parse(skill.updatedAt) - 60*60*24*30*1000).toISOString(), notes: 'Previous' }, // ~1 month ago
                //           { id: Math.random(), score: Math.max(0, skill.currentScore - 4), timestamp: new Date(Date.parse(skill.updatedAt) - 60*60*24*90*1000).toISOString(), notes: 'Earlier' }, // ~3 months ago
                //      ]
                //  }));
                //  setSkills(skillsWithLogs);
                setSkills(data); // Use this line if fetchSkills *does* return logs in the correct format
            })
            .catch(err => { console.error(err); setError('Failed to load dashboard data.'); })
            .finally(() => setIsLoading(false));
    }, []);

    // --- Prepare data for Radar Chart ---
    const radarChartData = useMemo(() => {
        if (!skills || skills.length < 3) return [];
        const sortedSkills = [...skills].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const skillsForChart = sortedSkills.slice(0, 7); // Use up to 7 skills
        if (skillsForChart.length < 3) return []; // Need at least 3 for radar
        return skillsForChart.map(skill => ({
            subject: skill.name,
            score: skill.currentScore,
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
        pieData.sort((a, b) => b.value - a.value); // Sort largest slice first
        return pieData;
    }, [skills]);

    // --- Prepare data for Multi-Skill Line Chart (Last 12 Months - Frontend Simulation) ---
    const multiSkillChartProcessedData = useMemo(() => {
        if (!skills || skills.length === 0) return { data: [], keys: [] };

        const endDate = new Date(); // Today
        const startDate = new Date(); // 1 year ago, start of month
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const MAX_SKILLS_ON_CHART = 5;
        const skillsToChart = skills /* ... filter/sort logic ... */ .slice(0, MAX_SKILLS_ON_CHART);

        if (skillsToChart.length === 0) return { data: [], keys: [] };
        const skillKeys = skillsToChart.map(s => s.name);

        const chartData: MultiProgressChartDataPoint[] = [];
        const lastKnownScores: { [skillId: number]: number | null } = {}; // Track last known score

        // Initialize lastKnownScores with the latest score *before* the overall start date
        skillsToChart.forEach(skill => {
            const logsBeforeStart = (skill.progressLogs || [])
                .filter(log => new Date(log.timestamp).getTime() < startDate.getTime()) // Strictly BEFORE start date
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            lastKnownScores[skill.id] = logsBeforeStart.length > 0 ? logsBeforeStart[0].score : null;
        });

        let currentIntervalStart = new Date(startDate);

        while (currentIntervalStart <= endDate) {
            // Determine the end of the current interval (start of next month, or endDate if last interval)
            let nextIntervalStart = new Date(currentIntervalStart);
            nextIntervalStart.setMonth(nextIntervalStart.getMonth() + 1);
            // Ensure the interval doesn't go beyond the overall endDate for filtering
            const intervalEnd = (nextIntervalStart > endDate) ? endDate.getTime() : nextIntervalStart.getTime();


            const point: MultiProgressChartDataPoint = {
                timestamp: currentIntervalStart.getTime(), // Timestamp for the X-axis point (start of month)
                dateLabel: currentIntervalStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) // Label for the point
            };

            for (const skill of skillsToChart) {
                // Find the latest log *within* the current interval [currentIntervalStart, intervalEnd)
                // Note: Using < intervalEnd to avoid including logs exactly at the start of the next month
                const logsInOrBeforeInterval = (skill.progressLogs || [])
                    .filter(log => new Date(log.timestamp).getTime() < intervalEnd) // Log occurred BEFORE start of next interval
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Most recent first

                let scoreForPoint: number | null = null;
                if (logsInOrBeforeInterval.length > 0) {
                    // Found a log before the end of this interval
                    scoreForPoint = logsInOrBeforeInterval[0].score;
                    lastKnownScores[skill.id] = scoreForPoint; // Update last known score
                } else {
                    // No log found within or before this interval ENDPOINT, use the last known score carried forward
                    scoreForPoint = lastKnownScores[skill.id] ?? null;
                }

                // Normalize score to percentage
                const normalizedScore = (scoreForPoint !== null && skill.maxScore > 0)
                    ? (scoreForPoint / skill.maxScore) * 100
                    : null;

                point[skill.name] = normalizedScore;
            }

            chartData.push(point);
            currentIntervalStart = nextIntervalStart; // Move to the start of the next month
        }


        return { data: chartData.length >= 2 ? chartData : [], keys: skillKeys };

    }, [skills]);


    // --- Other calculations ---
    const totalSkills = skills.length;
    const averageScore = totalSkills > 0 ? (skills.reduce((sum, skill) => sum + (skill.maxScore > 0 ? (skill.currentScore / skill.maxScore) : 0), 0) / totalSkills * 10) : 0;
    // Use already sorted skills if sort order is guaranteed, otherwise sort here
    const recentlyUpdated = [...skills].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

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
                            <Typography variant="body2" color="textSecondary">(Across all skills)</Typography>
                        </Paper>
                    </Grid>
                     <Grid item xs={12} md={4}>
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <Typography variant="h6" gutterBottom>Recently Updated</Typography>
                             {recentlyUpdated.length === 0 ? <Typography color="textSecondary">No skills tracked yet.</Typography> : (
                                 <List dense> {recentlyUpdated.map(skill => ( <ListItem key={skill.id} disablePadding> <ListItemText primary={skill.name} secondary={`Score: ${skill.currentScore}/${skill.maxScore}`} /> </ListItem> ))} </List>
                             )}
                         </Paper>
                     </Grid>

                    {/* --- Row 2: Pie & Radar --- */}
                     <Grid item xs={12} md={6}> {/* Pie takes half width on medium screens */}
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                            <CategoryPieChart data={categoryPieChartData} title="Skills by Category" />
                         </Paper>
                     </Grid>
                     <Grid item xs={12} md={6}> {/* Radar takes other half */}
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <SkillRadarChart data={radarChartData} title="Recent Skill Snapshot"/>
                         </Paper>
                     </Grid>

                     {/* --- Row 3: Multi-Skill Progress --- */}
                     <Grid item xs={12}> {/* Full width */}
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <MultiSkillProgressChart
                                 data={multiSkillChartProcessedData.data}
                                 skillKeys={multiSkillChartProcessedData.keys}
                                 title="Skill Progress Over Last Year (%)"
                             />
                         </Paper>
                     </Grid>

                </Grid>
            )}
        </Box>
    );
};

export default DashboardPage;