// src/components/AddCategoryModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    CircularProgress, Alert
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCategory, Category } from '../services/api'; // Import API function and Category type

// Schema
const addCategorySchema = z.object({
    name: z.string().min(1, 'Name required').max(100, 'Name too long'),
});
type AddCategoryFormData = z.infer<typeof addCategorySchema>;

interface AddCategoryModalProps {
    open: boolean;
    onClose: (newCategory?: Category) => void; // Pass back the new category on success
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ open, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { control, handleSubmit, reset, formState: { errors } } = useForm<AddCategoryFormData>({
        resolver: zodResolver(addCategorySchema), defaultValues: { name: '' }
    });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            reset({ name: '' });
            setError(null);
            setIsSubmitting(false);
        }
    }, [open, reset]);

    const handleAddSubmit: SubmitHandler<AddCategoryFormData> = async (data) => {
        setIsSubmitting(true); setError(null);
        try {
            const newCategory = await createCategory({ name: data.name });
            onClose(newCategory); // Close and pass back the newly created category
        } catch (err: any) {
            console.error("Failed to add category:", err);
            setError(err.response?.data?.message || 'Failed to add category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!isSubmitting) onClose(); // Close without passing data
    };

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
            <DialogTitle>Add New Category</DialogTitle>
            <Box component="form" onSubmit={handleSubmit(handleAddSubmit)} noValidate>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Controller name="name" control={control} render={({ field }) => (
                        <TextField {...field} autoFocus margin="dense" label="Category Name" type="text" fullWidth variant="outlined" error={!!errors.name} helperText={errors.name?.message} disabled={isSubmitting} />
                     )}/>
                </DialogContent>
                <DialogActions sx={{ pb: 2, pr: 2 }}>
                    <Button onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Add Category'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddCategoryModal;