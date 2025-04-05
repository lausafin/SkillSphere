// src/components/AddEditSkillModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, CircularProgress, Alert } from '@mui/material';
import SkillForm, { SkillFormData } from './SkillForm';
import { createSkill, updateSkill, fetchSkillById } from '../services/api';
// import { SkillData } from './SkillCard'; // For comparing API result if needed

interface AddEditSkillModalProps {
    open: boolean;
    onClose: (refreshNeeded?: boolean) => void;
    skillIdToEdit?: number | null;
}

const AddEditSkillModal: React.FC<AddEditSkillModalProps> = ({
    open,
    onClose,
    skillIdToEdit,
}) => {
    const [initialData, setInitialData] = useState<Partial<SkillFormData> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const mode = skillIdToEdit ? 'edit' : 'add';

    useEffect(() => {
        if (mode === 'edit' && skillIdToEdit && open) {
            setIsLoading(true);
            setError(null);
            setInitialData(undefined); // Clear previous data before fetching new
            fetchSkillById(skillIdToEdit)
                .then((skill) => {
                    setInitialData({
                        name: skill.name,
                        description: skill.description,
                        currentScore: skill.currentScore,
                        maxScore: skill.maxScore,   
                        ratingScaleType: skill.ratingScaleType,
                        categoryId: skill.category?.id ?? null,
                        tags: skill.tags?.map(({ tag }) => tag.name) ?? [],
                    });
                })
                .catch((err) => {
                    console.error("Failed to fetch skill for editing:", err);
                    setError(err.response?.data?.message || 'Failed to load skill data.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (mode === 'add' && open) {
             setInitialData(undefined); // Explicitly reset for add mode when opened
             setError(null);
             setIsLoading(false); // Ensure loading is false for add mode
        }
         // If modal is not open, do nothing
    }, [skillIdToEdit, mode, open]);


    const handleFormSubmit = async (data: SkillFormData) => {
        setIsSubmitting(true);
        setError(null);
        const apiData = {
            name: data.name,
            // Convert description: null -> undefined
            description: data.description === null ? undefined : data.description,
            // Ensure categoryId is number or null or undefined (as needed by API DTO)
            // If UpdateSkillDto allows only number|undefined, use:
            // categoryId: data.categoryId === null ? undefined : data.categoryId,
            // If UpdateSkillDto allows number|null|undefined (less likely for updates), use:
            categoryId: data.categoryId,
            currentScore: data.currentScore,
            maxScore: data.maxScore,
            ratingScaleType: data.ratingScaleType,
            tags: data.tags || [], // Ensure tags is an array
        };

        try {
            if (mode === 'edit' && skillIdToEdit) {
                 await updateSkill(skillIdToEdit, apiData);
            } else {
                 await createSkill(apiData);
            }
            onClose(true);
        } catch (err: any) {
            console.error(`Failed to ${mode} skill:`, err);
            setError(err.response?.data?.message || `Failed to ${mode} skill.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
         if (!isSubmitting) {
             onClose(false);
         }
    };

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
            <DialogTitle>{mode === 'add' ? 'Add New Skill' : 'Edit Skill'}</DialogTitle>
            <DialogContent>
                {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto', mb: 2 }}/>}
                {error && !isLoading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Render form when not loading initial data for edit mode, or always in add mode */}
                {(!isLoading || mode === 'add') && (
                    <SkillForm
                        // Use key to force re-render with new defaults/initialData when switching between add/edit or editing different items
                        key={mode === 'edit' ? `edit-${skillIdToEdit}` : 'add'}
                        initialData={initialData}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancel}
                        isSubmitting={isSubmitting}
                        mode={mode}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AddEditSkillModal;