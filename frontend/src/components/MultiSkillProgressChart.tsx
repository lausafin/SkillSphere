// src/components/MultiSkillProgressChart.tsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

// Define the structure for data points - keys will be skill names dynamically
export interface MultiProgressChartDataPoint {
    timestamp: number; // Unix timestamp (milliseconds) for the data point (e.g., start of month)
    dateLabel: string; // Formatted date string for display on X-axis
    [skillName: string]: number | string | null; // Dynamically add skill scores (value: 0-100 percentage)
}

interface MultiSkillProgressChartProps {
    data: MultiProgressChartDataPoint[]; // Processed data array from dashboard
    skillKeys: string[]; // Array of skill names (keys used in data objects)
    title?: string;
}

// Custom Tooltip formatter for multiple lines
const renderMultiLineTooltipContent = (props: any) => {
    const { active, payload, label } = props;
    const theme = useTheme();

    if (active && payload && payload.length) {
        return (
            <Box sx={{ /* ... same styling as single line tooltip ... */
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`, padding: '10px',
                boxShadow: theme.shadows[3], borderRadius: theme.shape.borderRadius,
            }}>
                <Typography variant="caption" display="block" gutterBottom>
                    {label} {/* Date Label */}
                </Typography>
                {payload.map((entry: any, index: number) => (
                    // Ensure value is a number before formatting
                    typeof entry.value === 'number' ? (
                        <Typography key={index} variant="body2" sx={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value.toFixed(1)}%`} {/* Show Skill Name: Score % */}
                        </Typography>
                    ) : null
                ))}
            </Box>
        );
    }
    return null;
};

// Generate distinct colors - simple approach
const generateColors = (count: number): string[] => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    // Extend if more colors needed
    while (colors.length < count) {
        // Basic color generation, might produce similar colors
        colors.push(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);
    }
    return colors.slice(0, count);
};


const MultiSkillProgressChart: React.FC<MultiSkillProgressChartProps> = ({ data, skillKeys, title }) => {
    const theme = useTheme();
    const colors = generateColors(skillKeys.length); // Generate colors for lines

    if (!data || data.length < 2 || skillKeys.length === 0) {
        return <Typography color="textSecondary" sx={{ textAlign: 'center', p: 2 }}>Not enough data to draw progress chart.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 350, mb: 3 }}>
            {title && <Typography variant="h6" align="center" gutterBottom>{title}</Typography>}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 20 }} // Increased bottom margin for label
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                        dataKey="timestamp" type="number" scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} // Format: Jan '23
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        // label={{ value: "Month", position: "insideBottom", dy: 10, fill: theme.palette.text.secondary, fontSize: 12 }} // Add X label
                    />
                    <YAxis
                        domain={[0, 100]} // Y Axis is Percentage (0-100)
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        width={40} // Adjust width for labels like "100%"
                    >
                         <Label value="Proficiency (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: theme.palette.text.secondary, fontSize: 12 }} />
                    </YAxis>
                    <Tooltip content={renderMultiLineTooltipContent} />
                    <Legend />
                    {/* Dynamically generate lines for each skill */}
                    {skillKeys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key} // Skill name is the key
                            name={key}    // Skill name for legend/tooltip
                            stroke={colors[index % colors.length]} // Assign color
                            strokeWidth={2}
                            dot={false} // Hide dots for cleaner multi-line chart
                            activeDot={{ r: 5 }}
                            connectNulls={true} // Connect gaps
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default MultiSkillProgressChart;