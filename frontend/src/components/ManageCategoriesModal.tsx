// src/components/ManageCategoriesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField,
    List, ListItem, ListItemText, IconButton, CircularProgress, Alert, Divider, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // Optional: for editing
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchCategories, createCategory, deleteCategory, updateCategory } from '../services/api'; // Import API functions
import DeleteConfirmationDialog from './DeleteConfirmationDialog'; // Reuse delete confirmation

// Define Category type locally or import
interface Category { id: number; name: string; }

// Schema for adding/editing a category
const categorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});
type CategoryFormData = z.infer<typeof categorySchema>;

interface ManageCategoriesModalProps {
    open: boolean;
    onClose: (categoriesChanged?: boolean) => void; // Callback on close, indicate if changes were made
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ open, onClose }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [categoriesChanged, setCategoriesChanged] = useState(false); // Track if changes were made

    // State for inline editing
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState<string>('');

    // State for delete confirmation
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema), defaultValues: { name: '' }
    });

    // Fetch categories when modal opens
    const loadCategories = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (err: any) { setError(err.response?.data?.message || 'Failed to load categories'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        if (open) {
            loadCategories();
            setCategoriesChanged(false); // Reset change tracker on open
            setAddError(null); // Clear previous errors
             reset(); // Reset add form
        }
    }, [open, loadCategories, reset]);

    // --- Add Category ---
    const handleAddCategory: SubmitHandler<CategoryFormData> = async (data) => {
        setIsSubmitting(true); setAddError(null);
        try {
            const newCategory = await createCategory({ name: data.name });
            setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
            reset(); // Clear the form
            setCategoriesChanged(true);
        } catch (err: any) { setAddError(err.response?.data?.message || 'Failed to add category'); }
        finally { setIsSubmitting(false); }
    };

    // --- Edit Category ---
    const handleStartEdit = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };
    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };
    const handleSaveEdit = async () => {
        if (!editingCategoryId || editingCategoryName.trim() === '') return;
         // Basic validation frontend side
        if (editingCategoryName.length > 100) {
            alert("Category name cannot exceed 100 characters."); // Simple alert, could use better feedback
            return;
        }

        setIsSubmitting(true); // Use general submit flag
        try {
            const updatedCategory = await updateCategory(editingCategoryId, { name: editingCategoryName });
            setCategories(prev => prev.map(cat => cat.id === editingCategoryId ? updatedCategory : cat).sort((a, b) => a.name.localeCompare(b.name)));
            setCategoriesChanged(true);
            handleCancelEdit(); // Exit edit mode
        } catch (err: any) { alert(`Failed to update category: ${err.response?.data?.message || 'Server error'}`); } // Simple alert for edit error
        finally { setIsSubmitting(false); }
    };


    // --- Delete Category ---
    const handleDeleteRequest = (category: Category) => {
        setDeletingCategory(category);
    };
    const handleConfirmDelete = async () => {
        if (!deletingCategory) return;
        const idToDelete = deletingCategory.id;
        setDeletingCategory(null); // Close dialog state
        try {
            await deleteCategory(idToDelete);
            setCategories(prev => prev.filter(cat => cat.id !== idToDelete));
            setCategoriesChanged(true);
        } catch (err: any) { alert(`Failed to delete category: ${err.response?.data?.message || 'Server error'}`); }
    };
    const handleCancelDelete = () => {
        setDeletingCategory(null);
    };

    // --- Close Modal ---
    const handleClose = () => {
        onClose(categoriesChanged); // Pass back whether changes were made
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogContent dividers>
                    {/* Add Category Form */}
                    <Box component="form" onSubmit={handleSubmit(handleAddCategory)} noValidate sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                        <Controller name="name" control={control} render={({ field }) => (
                            <TextField {...field} label="New Category Name" size="small" sx={{ flexGrow: 1 }} error={!!formErrors.name || !!addError} helperText={formErrors.name?.message || addError} disabled={isSubmitting}/>
                         )}/>
                        <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={isSubmitting}> Add </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Category List */}
                    <Typography variant="h6" gutterBottom>Existing Categories</Typography>
                    {isLoading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
                        <List dense>
                            {categories.length === 0 && <ListItem><ListItemText primary="No categories created yet." /></ListItem>}
                            {categories.map((category) => (
                                <ListItem
                                    key={category.id}
                                    secondaryAction={
                                        editingCategoryId === category.id ? (
                                            <>
                                                 <IconButton edge="end" aria-label="save" onClick={handleSaveEdit} disabled={isSubmitting || editingCategoryName.trim() === ''} size="small" color="primary"> <CheckIcon fontSize="inherit"/> </IconButton>
                                                 <IconButton edge="end" aria-label="cancel" onClick={handleCancelEdit} disabled={isSubmitting} size="small"> <CloseIcon fontSize="inherit"/> </IconButton>
                                            </>
                                        ) : (
                                            <>
                                                 <Tooltip title="Edit">
                                                     <IconButton edge="end" aria-label="edit" onClick={() => handleStartEdit(category)} disabled={isSubmitting} size="small"> <EditIcon fontSize="inherit"/> </IconButton>
                                                 </Tooltip>
                                                 <Tooltip title="Delete">
                                                     <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRequest(category)} disabled={isSubmitting} size="small" color="error"> <DeleteIcon fontSize="inherit"/> </IconButton>
                                                 </Tooltip>
                                            </>
                                        )
                                    }
                                    sx={{ pr: editingCategoryId === category.id ? '64px' : '96px' }} // Adjust padding for buttons
                                >
                                     {editingCategoryId === category.id ? (
                                         <TextField
                                             value={editingCategoryName}
                                             onChange={(e) => setEditingCategoryName(e.target.value)}
                                             size="small"
                                             variant="standard" // Keep it simple for inline edit
                                             fullWidth
                                             autoFocus
                                             disabled={isSubmitting}
                                             sx={{ mr: 1 }}
                                         />
                                     ) : (
                                         <ListItemText primary={category.name} />
                                     )}
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
                 open={!!deletingCategory}
                 onClose={handleCancelDelete}
                 onConfirm={handleConfirmDelete}
                 itemName={deletingCategory?.name || ''}
                 itemType="category"
            />
        </>
    );
};

export default ManageCategoriesModal;