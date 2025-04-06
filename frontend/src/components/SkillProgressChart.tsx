// src/components/SkillProgressChart.tsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

// Define the structure for data points
export interface ProgressChartDataPoint {
    timestamp: number; // Unix timestamp (milliseconds) for sorting and axis scaling
    dateLabel: string; // Formatted date string for display on X-axis
    score: number | null; // Skill score (allow null for potential gaps if needed)
    // Add more keys like 'Goal' if plotting target lines later
}

interface SkillProgressChartProps {
    data: ProgressChartDataPoint[];
    skillName?: string;
    maxScore: number; // To set the Y-axis domain correctly
}

// Custom Tooltip formatter
const renderTooltipContent = (props: any) => {
    const { active, payload, label } = props;
    const theme = useTheme(); // Use theme inside component

    if (active && payload && payload.length) {
        const data = payload[0].payload; // Access the full data point object
        return (
            <Box sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                padding: '10px',
                boxShadow: theme.shadows[3],
                borderRadius: theme.shape.borderRadius,
            }}>
                <Typography variant="caption" display="block" gutterBottom>
                    {/* Display the formatted date label */}
                    {data.dateLabel || label}
                </Typography>
                <Typography variant="body2" sx={{ color: payload[0].color }}>
                    {`${payload[0].name}: ${payload[0].value}`} {/* Display Score: value */}
                </Typography>
                {/* Add other info from data point if needed */}
                {/* e.g., <Typography variant="body2">Notes: {data.notes}</Typography> */}
            </Box>
        );
    }
    return null;
};


const SkillProgressChart: React.FC<SkillProgressChartProps> = ({ data, skillName = "Skill", maxScore }) => {
    const theme = useTheme();

    if (!data || data.length < 2) {
        // Line charts need at least 2 points to draw a line
        return <Typography color="textSecondary" sx={{ textAlign: 'center', p: 2 }}>Not enough history data to draw progress chart (minimum 2 points required).</Typography>;
    }

    // Format X-axis ticks (timestamps) into readable dates - Recharts does this somewhat automatically if type='number'
    // const formatDateTick = (timestamp: number) => {
    //     return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // };

    return (
        <Box sx={{ width: '100%', height: 250, mb: 3 }}> {/* Set height and margin */}
             {/* Optional Title */}
             {/* <Typography variant="subtitle1" align="center" gutterBottom>Progress Over Time</Typography> */}
             <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }} // Adjust margins
                >
                    {/* Grid */}
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />

                    {/* X Axis (Time) */}
                    <XAxis
                        dataKey="timestamp" // Use timestamp for scale
                        type="number"       // Treat as numerical scale
                        scale="time"        // Tell recharts it's time-based
                        domain={['dataMin', 'dataMax']} // Fit domain to data
                        tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-CA')} // Format ticks as YYYY-MM-DD (or locale default)
                        // tickFormatter={formatDateTick} // Or use custom formatter
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        // Optionally add label
                        // label={{ value: "Date", position: "insideBottom", dy: 10, fill: theme.palette.text.secondary, fontSize: 12 }}
                    />

                    {/* Y Axis (Score) */}
                    <YAxis
                        domain={[0, maxScore]} // Set domain from 0 to maxScore
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                    >
                        {/* Add Y Axis Label */}
                        <Label value="Score" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: theme.palette.text.secondary, fontSize: 12 }} />
                    </YAxis>

                    {/* Tooltip on Hover */}
                    <Tooltip content={renderTooltipContent} />

                    {/* Optional Legend (useful if plotting multiple lines/skills) */}
                     {/* <Legend /> */}

                    {/* The actual Line */}
                    <Line
                        type="monotone" // Smoothing ('linear', 'step', etc.)
                        dataKey="score"   // The key for the Y-value
                        name={skillName}  // Name for tooltip/legend
                        stroke={theme.palette.primary.main} // Line color
                        strokeWidth={2}
                        dot={{ r: 3, fill: theme.palette.primary.main }} // Style points
                        activeDot={{ r: 6 }} // Style point on hover
                        connectNulls={true} // Draw line even if there are null data points (gaps)
                    />
                    {/* Add more <Line> components for other data series (e.g., goal line) */}
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default SkillProgressChart;