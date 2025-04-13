// src/components/AddEditSkillModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Alert as MuiAlert, CircularProgress
} from '@mui/material'; // Keep Alert/Progress for display
import SkillForm, { SkillFormData } from './SkillForm';
import {
    createSkill, updateSkill, fetchSkillById, Category, // Import Category type
    CreateSkillDto, UpdateSkillDto // Import DTO types for casting if needed
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import ManageCategoriesModal from './ManageCategoriesModal'; // Import Manage modal
import AddCategoryModal from './AddCategoryModal'; // Import Add modal

// Custom Alert for potential use (if MuiAlert used directly)
// const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
//   return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
// });

interface AddEditSkillModalProps {
    open: boolean;
    onClose: (refreshNeeded?: boolean) => void;
    skillIdToEdit?: number | null;
}

const AddEditSkillModal: React.FC<AddEditSkillModalProps> = ({ open, onClose, skillIdToEdit }) => {
    const { user } = useAuth();
    // Type initialData more accurately if possible, using relevant fields from SkillFormData
    const [initialData, setInitialData] = useState<Partial<Omit<SkillFormData, 'ownership'|'teamId'|'initialScore'>> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading initial data for edit
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Form submission
    const [error, setError] = useState<string | null>(null); // Stores submit/fetch errors
    const mode = skillIdToEdit ? 'edit' : 'add';

    // State for category modals
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // Manage modal
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false); // Quick Add modal
    const [categoryVersion, setCategoryVersion] = useState(0); // To trigger refetch in form

    // Fetch initial data effect (for EDIT mode)
    useEffect(() => {
         if (mode === 'edit' && skillIdToEdit && open) {
             setIsLoading(true);
             setError(null); // Clear previous errors
             setInitialData(undefined); // Clear previous initial data
             fetchSkillById(skillIdToEdit)
                 .then((skill) => {
                     // Map fetched SkillData to the fields expected by SkillForm's initialData
                     setInitialData({
                         name: skill.name,
                         description: skill.description,
                         maxScore: skill.maxScore,
                         // initialScore is not set in edit mode
                         ratingScaleType: skill.ratingScaleType,
                         categoryId: skill.category?.id ?? null,
                         tags: skill.tags?.map(({ tag }) => tag.name) ?? [],
                         notes: '', // Or load from description/last log if desired? Clear notes for edit?
                         // Do NOT set ownership or teamId here
                     });
                 })
                 .catch((err) => {
                     console.error("Failed fetch skill for edit:", err);
                     setError(err.response?.data?.message || 'Failed to load skill data.');
                 })
                 .finally(() => setIsLoading(false));
         } else if (mode === 'add' && open) {
              // Ensure state is reset for add mode when modal opens
              setInitialData(undefined);
              setError(null);
              setIsLoading(false);
              setIsSubmitting(false); // Also reset submitting state
              setCategoryVersion(0); // Reset category version
         }
    }, [skillIdToEdit, mode, open]); // Dependencies for fetching initial data


    // Form Submit Handler
    const handleFormSubmit = async (data: SkillFormData) => {
        if (!user && mode === 'add' && data.ownership === 'personal') {
            setError("Cannot create personal skill: User not identified.");
            return;
        }

        setIsSubmitting(true); setError(null);

        // Prepare payload based on form data
        // Use more specific types if possible, matching backend DTOs
        const apiPayload: Partial<CreateSkillDto | UpdateSkillDto> = {
            name: data.name,
            description: data.description === null ? undefined : data.description, // Handle null
            categoryId: data.categoryId, // Pass null or ID
            maxScore: data.maxScore,
            ratingScaleType: data.ratingScaleType,
            tags: data.tags || [],
            notes: data.notes ?? undefined, // Include notes
        };

        if (mode === 'add') {
            // Include initial score only for create DTO
            (apiPayload as Partial<CreateSkillDto>).initialScore = data.initialScore ?? undefined;
            // Set ownership
            if (data.ownership === 'team' && data.teamId) {
                (apiPayload as Partial<CreateSkillDto>).teamId = data.teamId;
                (apiPayload as Partial<CreateSkillDto>).userId = null;
            } else {
                (apiPayload as Partial<CreateSkillDto>).userId = user?.id;
                (apiPayload as Partial<CreateSkillDto>).teamId = null;
            }
        }
        // Note: Update payload (apiPayload as UpdateSkillDto) should not contain
        // userId, teamId, or initialScore if backend ignores them for updates.

        try {
            if (mode === 'edit' && skillIdToEdit) {
                await updateSkill(skillIdToEdit, apiPayload as UpdateSkillDto);
            } else {
                await createSkill(apiPayload as CreateSkillDto);
            }
            onClose(true); // Close modal and signal refresh needed
        } catch (err: any) {
            console.error(`Failed to ${mode} skill:`, err);
            setError(err.response?.data?.message || `Failed to ${mode} skill.`); // Set error state to display
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cancel Handler
    const handleCancel = () => {
         if (!isSubmitting) {
             setError(null); // Clear error on cancel
             onClose(false); // Close modal without signalling refresh
         }
    };

    // Manage Categories Modal Handlers
    const handleOpenCategoryManager = () => setIsCategoryModalOpen(true);
    const handleCloseCategoryManager = (categoriesChanged?: boolean) => {
        setIsCategoryModalOpen(false);
        if (categoriesChanged) setCategoryVersion(prev => prev + 1); // Increment version to trigger refetch
    };

    // Add Category Modal Handlers
    const handleOpenAddCategory = () => setIsAddCategoryModalOpen(true);
    const handleCloseAddCategory = (newCategory?: Category) => {
        setIsAddCategoryModalOpen(false);
        if (newCategory) {
            setCategoryVersion(prev => prev + 1); // Increment version to trigger refetch
            // TODO Optional: Auto-select newCategory.id in the form? Requires passing setValue down.
        }
    };

    // --- Render ---
    return (
        <>
            {/* Main Add/Edit Skill Modal */}
            <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
                <DialogTitle>{mode === 'add' ? 'Add New Skill' : 'Edit Skill'}</DialogTitle>
                <DialogContent>
                    {/* Loading indicator for initial data fetch in edit mode */}
                     {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto', mb: 2 }}/>}
                     {/* Display general fetch/submit errors */}
                     {error && !isLoading && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}

                    {/* Render form only when not loading initial data (for edit) */}
                    {!isLoading && (
                        <SkillForm
                            // Add categoryVersion to key to help force re-render/refetch on category change
                            key={mode === 'edit' ? `edit-${skillIdToEdit}-${categoryVersion}` : `add-${categoryVersion}`}
                            initialData={mode === 'edit' ? initialData : undefined} // Pass initialData only for edit
                            onSubmit={handleFormSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            mode={mode}
                            onManageCategories={handleOpenCategoryManager} // Pass manage handler
                            onAddCategory={handleOpenAddCategory}       // Pass add handler
                            categoryVersion={categoryVersion}             // Pass version counter
                        />
                    )}
                </DialogContent>
                {/* Actions removed as SkillForm has Cancel/Submit buttons */}
            </Dialog>

            {/* Secondary Modals */}
            <ManageCategoriesModal
                 open={isCategoryModalOpen}
                 onClose={handleCloseCategoryManager}
            />
            <AddCategoryModal
                open={isAddCategoryModalOpen}
                onClose={handleCloseAddCategory}
            />
        </>
    );
};

export default AddEditSkillModal;