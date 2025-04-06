// src/components/SkillRadarChart.tsx
import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, Text
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material'; // Import useTheme for colors

// Define the structure of data points expected by the chart
interface RadarChartDataPoint {
    subject: string; // Skill name
    score: number;   // Current score for the main data series
    fullMark: number; // Max score for this skill's axis
    // Add more keys (e.g., 'goalScore') if comparing multiple series later
}

interface SkillRadarChartProps {
    data: RadarChartDataPoint[]; // Processed data array
    title?: string; // Optional chart title
}

// Custom tick component to handle long labels
const CustomizedAxisTick: React.FC<any> = (props) => {
    const { x, y, payload } = props;
    const MAX_WIDTH = 80; // Max width before potentially wrapping (adjust as needed)

    // Basic wrapping logic (could be more sophisticated)
    // Recharts doesn't easily support multi-line text directly in ticks.
    // This attempts to truncate or render within bounds. A library for SVG text wrapping might be needed for complex cases.
    const renderLabel = () => {
        if (typeof payload.value === 'string' && payload.value.length > 12) { // Simple length check
             return payload.value.substring(0, 10) + '...'; // Truncate long labels
        }
        return payload.value;
    };


    return (
        <g transform={`translate(${x},${y})`}>
            <Text
                x={0} y={0} dy={16}
                textAnchor="middle" // Center text below the point
                fill="#666" // Tick label color
                fontSize={12} // Adjust font size
                width={MAX_WIDTH} // Doesn't enforce wrapping but helps context
                // style={{ wordWrap: 'break-word' }} // Doesn't work directly in SVG Text
            >
                {renderLabel()}
            </Text>
        </g>
    );
};


const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ data, title }) => {
    const theme = useTheme(); // Access MUI theme for colors

    if (!data || data.length < 3) {
        // Radar charts need at least 3 points to render meaningfully
        return <Typography color="textSecondary" sx={{textAlign: 'center', p: 2}}>Not enough data points for radar chart (minimum 3 required).</Typography>;
    }

    // Find the overall maximum possible score across all skills for the radius axis
    const maxPossibleScore = Math.max(...data.map(p => p.fullMark), 0); // Ensure it's at least 0

    return (
        <Box sx={{ width: '100%', height: 350 }}> {/* Define container size */}
            {title && <Typography variant="h6" align="center" gutterBottom>{title}</Typography>}
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    {/* Grid lines */}
                    <PolarGrid />

                    {/* Axis Labels (Skill Names) */}
                    <PolarAngleAxis
                        dataKey="subject"
                        // Use custom tick for potentially better label handling
                        tick={<CustomizedAxisTick />} // Uncomment if needed, but basic truncation might be better first
                        //  tick={{ fontSize: 11, fill: theme.palette.text.secondary }} // Style basic tick
                    />

                    {/* Radius Axis (Score Scale) */}
                    {/* Set domain explicitly to ensure scale starts at 0 and goes to max */}
                    <PolarRadiusAxis
                        angle={30} // Position of the labels/scale line
                        domain={[0, maxPossibleScore]} // Scale from 0 to the highest max score
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                    />

                    {/* The actual Radar polygon */}
                    <Radar
                        name="Current Score" // Legend label
                        dataKey="score"      // The key in `data` holding the value
                        stroke={theme.palette.primary.main} // Line color from theme
                        fill={theme.palette.primary.main}   // Fill color from theme
                        fillOpacity={0.6} // Make fill semi-transparent
                    />

                    {/* Add more <Radar> components here if comparing multiple data sets */}
                    {/* e.g., <Radar name="Goal Score" dataKey="goalScore" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6}/> */}

                    {/* Optional Tooltip */}
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />

                    {/* --- MODIFIED LEGEND --- */}
                    <Legend
                        layout="vertical"    // Stack items vertically
                        align="right"        // Align the legend block to the right
                        verticalAlign="middle" // Center it vertically
                        // Optional: Adjust position slightly if needed
                        // wrapperStyle={{ paddingLeft: '10px' }}
                    />
                    {/* --- END MODIFIED LEGEND --- */}
                </RadarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default SkillRadarChart;