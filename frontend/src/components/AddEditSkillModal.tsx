// src/components/AddEditSkillModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Alert as MuiAlert, CircularProgress } from '@mui/material';
import SkillForm, { SkillFormData } from './SkillForm';
import { createSkill, updateSkill, fetchSkillById } from '../services/api';
import { CreateSkillDto, UpdateSkillDto } from '../services/api'; // Import DTOs if using assertion
import { useAuth } from '../context/AuthContext';
import ManageCategoriesModal from './ManageCategoriesModal'; // <-- Import Category Manager

interface AddEditSkillModalProps { open: boolean; onClose: (refresh?: boolean) => void; skillIdToEdit?: number | null; }

const AddEditSkillModal: React.FC<AddEditSkillModalProps> = ({ open, onClose, skillIdToEdit }) => {
    const { user } = useAuth(); // Get logged-in user info
    const [initialData, setInitialData] = useState<Partial<SkillFormData> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const mode = skillIdToEdit ? 'edit' : 'add';

    // --- NEW State for Category Modal ---
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    // State to trigger category refresh in SkillForm
    const [categoryVersion, setCategoryVersion] = useState(0);

    // ... useEffect for fetching initial data ...

    // --- useEffect for fetching initial data (for EDIT mode) ---
    useEffect(() => {
        // ... (Logic to fetch skill details for edit mode remains largely the same) ...
        // ... (Ensure it maps fetched data to all relevant fields EXCEPT ownership/teamId) ...
         if (mode === 'edit' && skillIdToEdit && open) {
             setIsLoading(true); setError(null); setInitialData(undefined);
             fetchSkillById(skillIdToEdit)
                 .then((skill) => {
                     setInitialData({ // Map only fields relevant to editing
                         name: skill.name, description: skill.description,
                         currentScore: skill.currentScore, maxScore: skill.maxScore,
                         ratingScaleType: skill.ratingScaleType,
                         categoryId: skill.category?.id ?? null,
                         tags: skill.tags?.map(({ tag }) => tag.name) ?? [],
                         // DO NOT set ownership or teamId here for edit mode
                     });
                 })
                 .catch(/*...error handling...*/)
                 .finally(() => setIsLoading(false));
         } else if (mode === 'add' && open) {
              setInitialData(undefined); setError(null); setIsLoading(false); // Reset for add mode
         }
    }, [skillIdToEdit, mode, open]);


    // --- Updated Submit Handler ---
    const handleFormSubmit = async (data: SkillFormData) => {
        if (!user && mode === 'add' && data.ownership === 'personal') {
            setError("Cannot create personal skill: User not identified."); // Should not happen if logged in
            return;
        }

        setIsSubmitting(true); setError(null);

        // Prepare data based on ownership (for CREATE) or standard update
        let apiPayload: any = { // Use 'any' for flexibility or define precise Create/Update DTO types
            name: data.name,
            description: data.description === null ? undefined : data.description,
            categoryId: data.categoryId === undefined ? null : data.categoryId,
            currentScore: data.currentScore,
            maxScore: data.maxScore,
            ratingScaleType: data.ratingScaleType,
            tags: data.tags || [],
            // Include notes only if present in SkillFormData and relevant for API
            notes: data.notes, // Assuming 'notes' might be part of SkillFormData now
        };

        if (mode === 'add') {
            if (data.ownership === 'team' && data.teamId) {
                apiPayload.teamId = data.teamId;
                apiPayload.userId = null; // Explicitly null for team skill
            } else {
                // Personal skill (or default if something went wrong)
                apiPayload.userId = user?.id; // Assign current user ID
                apiPayload.teamId = null; // Explicitly null for personal skill
            }
        }
        // NOTE: We generally DO NOT change ownership (userId/teamId) during an UPDATE operation.
        // The backend `updateSkill` should likely ignore userId/teamId in the payload.

        try {
            if (mode === 'edit' && skillIdToEdit) {
                // Pass only updatable fields
                await updateSkill(skillIdToEdit, apiPayload as UpdateSkillDto); // Cast if needed
            } else {
                // Pass full payload for creation
                await createSkill(apiPayload as CreateSkillDto); // Cast if needed
            }
            onClose(true);
        } catch (err: any) {
            console.error(`Failed to ${mode} skill:`, err);
            setError(err.response?.data?.message || `Failed to ${mode} skill.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => { if (!isSubmitting) onClose(false); };

    // --- NEW Handlers for Category Modal ---
    const handleOpenCategoryManager = () => {
        setIsCategoryModalOpen(true);
    };

    const handleCloseCategoryManager = (categoriesChanged?: boolean) => {
        setIsCategoryModalOpen(false);
        if (categoriesChanged) {
            // Increment version to trigger refetch in SkillForm
            setCategoryVersion(prev => prev + 1);
        }
    };

    return (
        <> {/* Use Fragment to return multiple root elements */}
            <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
                <DialogTitle>{mode === 'add' ? 'Add New Skill' : 'Edit Skill'}</DialogTitle>
                <DialogContent>
                    {/* --- DISPLAY LOADING AND ERROR --- */}
                    {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto', mb: 2 }}/>}
                    {error && !isLoading && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
                     {/* --- END DISPLAY --- */}
                    {!isLoading && (
                        <SkillForm
                            key={mode === 'edit' ? `edit-${skillIdToEdit}-${categoryVersion}` : `add-${categoryVersion}`} // Add categoryVersion to key
                            initialData={mode === 'edit' ? initialData : undefined}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            mode={mode}
                            // --- Pass handler to open category manager ---
                            onManageCategories={handleOpenCategoryManager}
                            // Pass version to trigger refetch
                            categoryVersion={categoryVersion}
                        />
                    )}
                </DialogContent>
                {/* DialogActions can stay here if needed, but form has its own buttons */}
            </Dialog>

            {/* Render the Category Management Modal */}
            <ManageCategoriesModal
                 open={isCategoryModalOpen}
                 onClose={handleCloseCategoryManager}
            />
        </>
    );
};

export default AddEditSkillModal;