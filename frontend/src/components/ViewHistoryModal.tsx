// src/components/ViewHistoryModal.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
    List, ListItem, ListItemText, Divider, CircularProgress, Alert, TextField,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchProgressLogs, createProgressLog } from '../services/api';
// import DeleteConfirmationDialog from './DeleteConfirmationDialog'; // Assuming still needed if deleting logs becomes feature
import SkillProgressChart from './SkillProgressChart'; // Import the progress chart

// Define Log data structure
interface ProgressLogData { id: number; timestamp: string; score: number; notes?: string | null; timeSpentMinutes?: number | null; }

// Define form schema
const createAddLogSchema = (maxScore: number) => z.object({ /* ... schema same as before ... */
    score: z.coerce.number().int().min(0).max(maxScore, `Score cannot exceed ${maxScore}`),
    notes: z.string().max(1000).optional().nullable(),
    timeSpentMinutes: z.coerce.number().int().min(0).optional().nullable(),
});
type AddLogFormData = z.infer<ReturnType<typeof createAddLogSchema>>;


interface ViewHistoryModalProps { open: boolean; onClose: (refresh?: boolean) => void; skillId: number | null; skillName?: string; maxScore?: number; }

const ViewHistoryModal: React.FC<ViewHistoryModalProps> = ({ open, onClose, skillId, skillName = 'Skill', maxScore = 10 }) => {
    const [logs, setLogs] = useState<ProgressLogData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [addLogError, setAddLogError] = useState<string | null>(null);
    const [lastAddedLogTimestamp, setLastAddedLogTimestamp] = useState<string | null>(null);

    const addLogSchema = createAddLogSchema(maxScore);
    const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<AddLogFormData>({
        resolver: zodResolver(addLogSchema), defaultValues: { score: 0, notes: '', timeSpentMinutes: undefined },
    });

    useEffect(() => { /* ... Same fetch logic ... */
        if (open && skillId !== null) {
            setIsLoading(true); setError(null); setAddLogError(null); setLogs([]);
            reset({ score: 0, notes: '', timeSpentMinutes: undefined });
            setLastAddedLogTimestamp(null);
            fetchProgressLogs(skillId)
                .then(data => setLogs(data)) // Data is naturally ordered desc by backend
                .catch(err => { console.error("Fetch Logs Err:", err); setError('Failed to load history.'); })
                .finally(() => setIsLoading(false));
        }
    }, [open, skillId, reset]);

    const handleAddLogSubmit: SubmitHandler<AddLogFormData> = async (data) => { /* ... Same submit logic ... */
        if (!skillId) return; setIsSubmitting(true); setAddLogError(null);
        try {
            const newLog = await createProgressLog(skillId, { score: data.score, notes: data.notes ?? undefined, timeSpentMinutes: data.timeSpentMinutes ?? undefined, });
            setLogs(prevLogs => [newLog, ...prevLogs]); // Add new log to the top (maintains desc order for list)
            setLastAddedLogTimestamp(newLog.timestamp); reset();
        } catch (err: any) { console.error("Add Log Err:", err); setAddLogError(err.response?.data?.message || 'Failed to save.'); }
        finally { setIsSubmitting(false); }
     };

    const handleClose = () => onClose(!!lastAddedLogTimestamp);

    // --- Prepare data for the Line Chart ---
    const chartData = useMemo(() => {
        if (!logs || logs.length === 0) return [];
        // Logs are fetched descending, reverse them for chronological chart order
        // Also transform into the format needed by SkillProgressChart
        return [...logs].reverse().map(log => ({
            timestamp: new Date(log.timestamp).getTime(), // Convert ISO string to timestamp number
            // Format date for display - use a consistent format e.g., YYYY-MM-DD
            dateLabel: new Date(log.timestamp).toLocaleDateString('en-CA'), // Example: 2023-10-26
            score: log.score,
            // Include notes if you want them in tooltip (requires modification to chart tooltip)
            // notes: log.notes
        }));
    }, [logs]); // Recompute only when logs change

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Progress History for "{skillName}"</DialogTitle>
            <DialogContent dividers>

                {/* --- Add Progress Chart --- */}
                {isLoading ? <CircularProgress size={20}/> : error ? <Alert severity="warning">{error}</Alert> : (
                     // Render chart only if not loading/erroring AND data exists
                     !isLoading && !error && logs.length > 0 &&
                     <SkillProgressChart
                        data={chartData}
                        skillName={skillName}
                        maxScore={maxScore}
                    />
                )}
                {/* --- End Progress Chart --- */}


                {/* Add New Log Form */}
                <Box component="form" onSubmit={handleSubmit(handleAddLogSubmit)} noValidate sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    {/* ... Form content same as before ... */}
                     <Typography variant="h6" gutterBottom>Add New Log Entry</Typography>
                     <Controller name="score" control={control} render={({ field }) => ( <TextField {...field} margin="dense" required fullWidth type="number" label={`Score (0-${maxScore})`} error={!!formErrors.score} helperText={formErrors.score?.message} disabled={isSubmitting} /> )} />
                     <Controller name="notes" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} margin="dense" fullWidth multiline rows={2} label="Notes / Evidence Link (Optional)" error={!!formErrors.notes} helperText={formErrors.notes?.message} disabled={isSubmitting} /> )} />
                     <Controller name="timeSpentMinutes" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} margin="dense" fullWidth type="number" label="Time Spent (Minutes, Optional)" inputProps={{ min: 0 }} error={!!formErrors.timeSpentMinutes} helperText={formErrors.timeSpentMinutes?.message} disabled={isSubmitting} /> )} />
                     {addLogError && <Alert severity="error" sx={{ mt: 1 }}>{addLogError}</Alert>}
                     <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={isSubmitting}> {isSubmitting ? 'Saving...' : 'Add Log'} </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* History List */}
                <Typography variant="h6" gutterBottom>Log Entries</Typography>
                 {isLoading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert>
                 : logs.length === 0 ? <Typography>No progress history recorded yet.</Typography>
                 : ( <List dense> {logs.map((log) => ( // List remains ordered descending
                         <React.Fragment key={log.id}>
                            <ListItem alignItems="flex-start"> 
                                <ListItemText 
                                    primary={`Score: ${log.score}`} 
                                    secondary={`Notes: ${log.notes || 'No notes provided'}`} 
                                /> 
                            </ListItem>
                            <Divider variant="inset" component="li" />
                        </React.Fragment>
                    ))} </List>
                )}
            </DialogContent>
            <DialogActions> <Button onClick={handleClose}>Close</Button> </DialogActions>
        </Dialog>
    );
};

export default ViewHistoryModal;