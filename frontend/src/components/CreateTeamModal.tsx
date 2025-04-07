// src/components/CreateTeamModal.tsx (New File)
import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    CircularProgress, Alert
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createTeam } from '../services/api'; // Import API function

// Schema for creating a team
const createTeamSchema = z.object({
    name: z.string().min(1, 'Team name is required').max(100, 'Team name cannot exceed 100 characters'),
});
type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamModalProps {
    open: boolean;
    onClose: (created?: boolean) => void; // Callback on close, boolean indicates success
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ open, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<CreateTeamFormData>({
        resolver: zodResolver(createTeamSchema), defaultValues: { name: '' }
    });

    const handleCreateTeam: SubmitHandler<CreateTeamFormData> = async (data) => {
        setIsSubmitting(true); setError(null);
        try {
            await createTeam({ name: data.name });
            reset(); // Reset form on success
            onClose(true); // Close modal and signal success
        } catch (err: any) {
            console.error("Failed to create team:", err);
            setError(err.response?.data?.message || 'Failed to create team.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!isSubmitting) {
            reset(); // Reset form fields on cancel
            setError(null); // Clear errors
            onClose(false); // Close modal, signal no success
        }
    };

    // Reset form when modal closes (ensures clean state next time it opens)
    // This is handled by handleCancel now, but useEffect could also be used
    // useEffect(() => {
    //     if (!open) {
    //         reset();
    //         setError(null);
    //         setIsSubmitting(false); // Ensure submitting state is reset too
    //     }
    // }, [open, reset]);


    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
            <DialogTitle>Create New Team</DialogTitle>
            <Box component="form" onSubmit={handleSubmit(handleCreateTeam)} noValidate>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                autoFocus
                                margin="dense"
                                id="team-name"
                                label="Team Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                error={!!formErrors.name}
                                helperText={formErrors.name?.message}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions sx={{ pb: 2, pr: 2 }}>
                    <Button onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Create Team'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default CreateTeamModal;