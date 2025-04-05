// src/components/ViewHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
    List, ListItem, ListItemText, Divider, CircularProgress, Alert, TextField,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchProgressLogs, createProgressLog } from '../services/api';

// Define Log data structure
interface ProgressLogData {
    id: number;
    timestamp: string;
    score: number;
    notes?: string | null;
    timeSpentMinutes?: number | null;
    // evidence?: any[];
}

// Define form schema, incorporating maxScore dynamically
const createAddLogSchema = (maxScore: number) => z.object({
    score: z.coerce.number().int().min(0, 'Score cannot be negative').max(maxScore, `Score cannot exceed ${maxScore}`),
    notes: z.string().max(1000).optional().nullable(),
    timeSpentMinutes: z.coerce.number().int().min(0).optional().nullable(),
});

// Form data type derived from base schema (without dynamic max)
type AddLogFormData = z.infer<ReturnType<typeof createAddLogSchema>>;

interface ViewHistoryModalProps {
    open: boolean;
    onClose: (refreshNeeded?: boolean) => void;
    skillId: number | null;
    skillName?: string;
    maxScore?: number; // Pass the max score from the skill
}

const ViewHistoryModal: React.FC<ViewHistoryModalProps> = ({
    open, onClose, skillId, skillName = 'Skill', maxScore = 10, // Use passed maxScore or default
}) => {
    const [logs, setLogs] = useState<ProgressLogData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [addLogError, setAddLogError] = useState<string | null>(null);

    // Create the schema dynamically based on the actual maxScore
    const addLogSchema = createAddLogSchema(maxScore);

    const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<AddLogFormData>({
        resolver: zodResolver(addLogSchema),
        defaultValues: { score: 0, notes: '', timeSpentMinutes: undefined }, // Use undefined for optional numbers
    });

    const [lastAddedLogTimestamp, setLastAddedLogTimestamp] = useState<string | null>(null);

    useEffect(() => {
        if (open && skillId !== null) {
            setIsLoading(true);
            setError(null);
            setAddLogError(null); // Clear add form error too
            setLogs([]);
            reset({ score: 0, notes: '', timeSpentMinutes: undefined }); // Reset form on open
            setLastAddedLogTimestamp(null); // Reset flag
            fetchProgressLogs(skillId)
                .then(data => setLogs(data))
                .catch(err => {
                    console.error("Failed to fetch logs:", err);
                    setError(err.response?.data?.message || 'Failed to load history.');
                })
                .finally(() => setIsLoading(false));
        }
    }, [open, skillId, reset]); // Add reset to dependencies

    const handleAddLogSubmit: SubmitHandler<AddLogFormData> = async (data) => {
        if (!skillId) return;
        setIsSubmitting(true);
        setAddLogError(null);
        try {
            const newLog = await createProgressLog(skillId, {
                score: data.score,
                notes: data.notes ?? undefined,
                timeSpentMinutes: data.timeSpentMinutes ?? undefined, // Pass undefined if null/empty
            });
            setLogs(prevLogs => [newLog, ...prevLogs]);
            setLastAddedLogTimestamp(newLog.timestamp); // Track that a log was added
            reset(); // Reset form after successful submission
        } catch (err: any) {
            console.error("Failed to add log:", err);
            setAddLogError(err.response?.data?.message || 'Failed to save log entry.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
         // Signal refresh only if a log was actually added in this session
        onClose(!!lastAddedLogTimestamp);
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Progress History for "{skillName}" (Max Score: {maxScore})</DialogTitle>
            <DialogContent dividers>
                {/* Add New Log Form */}
                <Box component="form" onSubmit={handleSubmit(handleAddLogSubmit)} noValidate sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>Add New Log Entry</Typography>
                     <Controller name="score" control={control}
                        render={({ field }) => ( <TextField {...field} margin="dense" required fullWidth type="number" label={`Score (0-${maxScore})`} error={!!formErrors.score} helperText={formErrors.score?.message} disabled={isSubmitting} /> )} />
                     <Controller name="notes" control={control}
                        render={({ field }) => ( <TextField {...field} value={field.value ?? ''} margin="dense" fullWidth multiline rows={2} label="Notes / Evidence Link (Optional)" error={!!formErrors.notes} helperText={formErrors.notes?.message} disabled={isSubmitting} /> )} />
                     <Controller name="timeSpentMinutes" control={control}
                        render={({ field }) => ( <TextField {...field} value={field.value ?? ''} margin="dense" fullWidth type="number" label="Time Spent (Minutes, Optional)" inputProps={{ min: 0 }} error={!!formErrors.timeSpentMinutes} helperText={formErrors.timeSpentMinutes?.message} disabled={isSubmitting} /> )} />
                     {addLogError && <Alert severity="error" sx={{ mt: 1 }}>{addLogError}</Alert>}
                     <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Add Log'}
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* History List */}
                <Typography variant="h6" gutterBottom>History</Typography>
                 {isLoading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert>
                 : logs.length === 0 ? <Typography>No progress history recorded yet.</Typography>
                 : ( <List dense> {logs.map((log) => (
                         <React.Fragment key={log.id}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={ <Typography component="span" variant="body1" sx={{ fontWeight: 'bold' }}> Score: {log.score} {log.timeSpentMinutes ? ` (${log.timeSpentMinutes} min)` : ''} </Typography> }
                                    secondary={ <>
                                        <Typography component="span" variant="body2" color="text.primary" display="block"> {new Date(log.timestamp).toLocaleString()} </Typography>
                                        {log.notes && ( <Typography component="span" variant="body2" sx={{ display: 'block', whiteSpace: 'pre-wrap', mt: 0.5 }}> {log.notes} </Typography> )}
                                    </> } />
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