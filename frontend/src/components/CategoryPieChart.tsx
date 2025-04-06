// src/components/CategoryPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography, Box } from '@mui/material';

// Define the structure for data points in the pie chart
interface PieChartDataPoint {
    name: string;  // Category name (or "Uncategorized")
    value: number; // Count of skills in this category
}

interface CategoryPieChartProps {
    data: PieChartDataPoint[]; // Processed data array
    title?: string;
}

// Define some colors - you can customize these or generate them programmatically
// Consider using theme colors if appropriate
const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF',
    '#FF1919', '#19D4FF', '#FFD419', '#8B8B8B' // Add more colors if needed
];

// Custom label rendering for Pie slices (optional, can show percentage)
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    // const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Position label halfway out
    // Increase distance for smaller slices to avoid overlap
    const labelRadius = innerRadius + (outerRadius - innerRadius) * (percent < 0.05 ? 1.1 : 0.6);
    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

    // Don't render label for very small slices to avoid clutter
    if (percent < 0.03) {
        return null;
    }

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
            {/* {name} {/* Optionally show name too, might get crowded */}
        </text>
    );
};


const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, title }) => {
    // const theme = useTheme(); // Access theme if needed for Tooltip style etc.

    if (!data || data.length === 0) {
        return <Typography color="textSecondary" sx={{ textAlign: 'center', p: 2 }}>No category data available.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 350 }}> {/* Container size */}
             {title && <Typography variant="h6" align="center" gutterBottom>{title}</Typography>}
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"      // Center X
                        cy="50%"      // Center Y
                        labelLine={false} // Disable lines pointing to labels if using custom labels inside
                        label={renderCustomizedLabel} // Use custom label function
                        outerRadius="80%" // Size of the pie relative to container
                        fill="#8884d8" // Default fill (overridden by Cells)
                        dataKey="value" // Key in data object holding the value/count
                        nameKey="name"    // Key in data object holding the label/category name
                    >
                        {/* Assign colors to each slice */}
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    {/* Tooltip shows details on hover */}
                     <Tooltip formatter={(value: number, name: string) => [`${value} skills`, name]} />
                     {/* Legend displays category names */}
                     <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default CategoryPieChart;