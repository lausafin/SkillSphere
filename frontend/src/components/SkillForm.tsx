// src/components/SkillForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    TextField, Button, Box, Slider, Typography, FormControl, InputLabel, Select,
    MenuItem, Autocomplete, Chip, CircularProgress, Alert, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { fetchCategories, fetchTags, fetchUserTeams, UserTeamListItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Define Category and Tag types locally or import
interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

// Define base Zod schema including new fields
const baseSkillSchema = z.object({
    name: z.string().min(1, 'Required').max(100),
    description: z.string().max(500).optional().nullable(),
    maxScore: z.coerce.number().int().min(1, 'Max score >= 1').max(1000, 'Max score too high').default(10), // Added upper max
    currentScore: z.coerce.number().int().min(0).default(0),
    categoryId: z.coerce.number().int().positive().optional().nullable(),
    ratingScaleType: z.string().default('numeric'),
    tags: z.array(z.string()).max(10, "Maximum 10 tags").optional().default([]),
    ownership: z.enum(['personal', 'team']).default('personal'),
    teamId: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(), // Added notes field
});

// Define refined schema within the component using watched 'maxScore'
// This approach requires careful handling or might be better done with a custom validator if complex
// For now, we define the dynamic part within the rules prop of the Controller


// Define form data type
export type SkillFormData = z.infer<typeof baseSkillSchema>;

interface SkillFormProps {
    initialData?: Partial<SkillFormData>;
    onSubmit: SubmitHandler<SkillFormData>;
    onCancel: () => void;
    isSubmitting: boolean;
    mode: 'add' | 'edit';
}

const SkillForm: React.FC<SkillFormProps> = ({
    initialData, onSubmit, onCancel, isSubmitting, mode
}) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [existingTags, setExistingTags] = useState<Tag[]>([]);
    const [userOwnedTeams, setUserOwnedTeams] = useState<UserTeamListItem[]>([]);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const [dataFetchError, setDataFetchError] = useState<string | null>(null);

    const { control, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm<SkillFormData>({
        // Use Zod resolver with refinement for team selection
         resolver: zodResolver(
            baseSkillSchema.refine(data => data.currentScore <= data.maxScore, {
                message: "Current score cannot exceed max score", path: ["currentScore"],
            }).refine(data => data.ownership === 'personal' || (data.ownership === 'team' && data.teamId != null), {
                message: "Please select a team", path: ["teamId"],
            })
        ),
        defaultValues: {
            name: '', description: '', currentScore: 0, maxScore: 10,
            ratingScaleType: 'numeric', categoryId: null, tags: [],
            ownership: 'personal', teamId: null, notes: '', // Default notes
            // Spread initial data only in edit mode, AFTER defaults
            ...(mode === 'edit' ? initialData : {})
        },
    });

    // Watch values needed for dynamic logic/display
    const currentScoreValue = watch('currentScore');
    const maxScoreValue = watch('maxScore');
    const ownershipValue = watch('ownership');

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchData = async () => {
            setLoadingFormData(true); setDataFetchError(null);
            try {
                const teamPromise = (mode === 'add' && user) ? fetchUserTeams() : Promise.resolve([]);
                const [catData, tagData, teamData] = await Promise.all([fetchCategories(), fetchTags(), teamPromise]);
                setCategories(catData);
                setExistingTags(tagData);
                // Simplified: User can create for teams they own. Refine later with roles.
                setUserOwnedTeams(teamData.filter(team => team.ownerId === user?.id));
            } catch (error: any) { setDataFetchError("Could not load categories/tags/teams."); console.error(error); }
            finally { setLoadingFormData(false); }
        };
        fetchData();
    }, [mode, user]); // Dependencies for fetching

    // --- Form Reset Effect ---
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // Reset with initial data for editing, explicitly clearing ownership fields
            reset({
                ...initialData, // Spread existing skill data
                categoryId: initialData.categoryId ?? null,
                tags: initialData.tags || [],
                notes: initialData.notes || '', // Include notes if editing allows changing them
                ownership: 'personal', // Reset ownership for edit mode (cannot change)
                teamId: null,
            });
        } else if (mode === 'add') {
            // Reset to blank defaults for adding
             reset({
                 name: '', description: '', currentScore: 0, maxScore: 10,
                 ratingScaleType: 'numeric', categoryId: null, tags: [],
                 ownership: 'personal', teamId: null, notes: '',
             });
        }
    }, [initialData, mode, reset]); // Dependencies for resetting

    useEffect(() => {
        if (mode === 'add' && ownershipValue === 'team' && userOwnedTeams.length === 1) {
             // Only one team available, auto-select it
             setValue('teamId', userOwnedTeams[0].id, { shouldValidate: true }); // Set value and trigger validation if needed
        }

    }, [mode, ownershipValue, userOwnedTeams, setValue]);

    // --- Dynamic Score Validation Schema (used in Controller rules) ---
     const scoreValidationSchema = z.coerce
        .number({ invalid_type_error: 'Score must be a number' })
        .min(0, { message: 'Score cannot be negative' })
        .max(isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue, {
            message: `Score cannot exceed max score (${isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue})`
        });

    // --- Render ---
    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            {/* Loading/Error indicators */}
            {loadingFormData && <CircularProgress size={20} sx={{ display: 'block', margin: 'auto', mb: 2 }} />}
            {dataFetchError && <Alert severity="error" sx={{ mb: 2 }}>{dataFetchError}</Alert>}

            {/* --- Ownership Selection (Only in ADD mode & if user has teams) --- */}
            {mode === 'add' && userOwnedTeams.length > 0 && (
                <FormControl component="fieldset" margin="normal" disabled={isSubmitting || loadingFormData}>
                    <Typography variant="subtitle1" component="legend" sx={{ mb: 1 }}>Skill Ownership</Typography>
                    <Controller name="ownership" control={control}
                        render={({ field }) => ( <RadioGroup row {...field}> <FormControlLabel value="personal" control={<Radio />} label="Personal Skill" /> <FormControlLabel value="team" control={<Radio />} label="Team Skill" /> </RadioGroup> )} />
                </FormControl>
            )}

            {/* --- Team Selection Dropdown (Only if 'team' ownership selected in ADD mode) --- */}
             {mode === 'add' && ownershipValue === 'team' && (
                 <FormControl fullWidth margin="normal" required disabled={isSubmitting || loadingFormData} error={!!errors.teamId}>
                    <InputLabel id="team-select-label">Select Team</InputLabel>
                    <Controller name="teamId" control={control}
                        render={({ field }) => ( <Select {...field} labelId="team-select-label" label="Select Team *" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} > <MenuItem value="" disabled><em>Select a team...</em></MenuItem> {userOwnedTeams.map((team) => ( <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem> ))} </Select> )} />
                     {errors.teamId && <Typography color="error" variant="caption" sx={{ml: 2}}>{errors.teamId.message}</Typography>}
                 </FormControl>
             )}

            {/* --- Standard Skill Fields --- */}
            {/* Name */}
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} margin="normal" required fullWidth label="Skill Name" autoFocus={mode === 'add' && ownershipValue === 'personal'} error={!!errors.name} helperText={errors.name?.message} disabled={isSubmitting || loadingFormData} />} />
            {/* Description */}
            <Controller name="description" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} margin="normal" fullWidth label="Description (Optional)" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} disabled={isSubmitting || loadingFormData} />} />
            {/* Category */}
            <FormControl fullWidth margin="normal" disabled={isSubmitting || loadingFormData}> <InputLabel>Category (Optional)</InputLabel> <Controller name="categoryId" control={control} defaultValue={null} render={({ field }) => ( <Select {...field} label="Category (Optional)" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} > <MenuItem value=""><em>None</em></MenuItem> {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)} </Select> )} /> </FormControl>
             {/* Tags */}
             <Controller name="tags" control={control} defaultValue={[]} render={({ field }) => ( <Autocomplete multiple options={existingTags.map(t => t.name)} value={field.value || []} freeSolo disabled={isSubmitting || loadingFormData} onChange={(_, v) => field.onChange([...new Set(v.map(val => typeof val === 'string' ? val.trim() : val))].filter(Boolean))} renderTags={(v, getTagProps) => v.map((o, i) => (<Chip {...getTagProps({ index: i })} variant="outlined" label={o} size="small"/>))} renderInput={(p) => (<TextField {...p} variant="outlined" label="Tags (Optional)" margin="normal" error={!!errors.tags} helperText={errors.tags?.message} />)} /> )} />

             {/* --- Notes Field --- */}
            <Controller name="notes" control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        value={field.value || ''} // Handle null/undefined for controlled component
                        margin="normal"
                        fullWidth
                        id="notes"
                        label={mode === 'add' ? "Initial Notes (Optional)" : "Notes (Optional)"} // Adjust label slightly
                        multiline
                        rows={2} // Maybe shorter for initial notes?
                        error={!!errors.notes}
                        helperText={errors.notes?.message || (mode === 'add' ? "Optionally add notes about the initial score." : "")}
                        disabled={isSubmitting || loadingFormData}
                    />
                )}
            />

            {/* Scores */}
             <Controller name="maxScore" control={control} render={({ field }) => <TextField {...field} margin="normal" required fullWidth label="Maximum Score" type="number" inputProps={{ min: 1, max: 1000 }} error={!!errors.maxScore} helperText={errors.maxScore?.message || "Highest possible score"} disabled={isSubmitting || loadingFormData} />} />
             <Box sx={{ mt: 2, mb: 1 }}>
                 <Typography gutterBottom> Current Score ({currentScoreValue ?? 0} / {maxScoreValue || 10}) </Typography>
                 <Controller name="currentScore" control={control}
                      rules={{ validate: value => { const result = scoreValidationSchema.safeParse(value); return result.success || result.error?.errors?.[0]?.message || 'Invalid score'; } }}
                     render={({ field }) => ( <Slider {...field} value={field.value ?? 0} valueLabelDisplay="auto" step={1} marks min={0} max={isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue} disabled={isSubmitting || isNaN(maxScoreValue) || maxScoreValue < 1 || loadingFormData} onChange={(_, v) => field.onChange(v)} /> )} />
                 {errors.currentScore && <Typography color="error" variant="caption">{errors.currentScore.message}</Typography>}
             </Box>

            {/* Buttons */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting || loadingFormData}>
                    {isSubmitting ? 'Saving...' : (mode === 'add' ? 'Add Skill' : 'Update Skill')}
                </Button>
            </Box>
        </Box>
    );
};

export default SkillForm;