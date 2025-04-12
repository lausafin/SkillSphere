// src/components/SkillForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    TextField, Button, Box, Slider, Typography, FormControl, InputLabel, Select,
    MenuItem, Autocomplete, Chip, CircularProgress, Alert, RadioGroup, FormControlLabel, Radio, IconButton, Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings'; // Import SettingsIcon
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Import Add Icon
import { fetchCategories, fetchTags, fetchUserTeams, UserTeamListItem, Category } from '../services/api'; // Ensure Category type is imported if used
import { useAuth } from '../context/AuthContext';

// Define Tag type locally if not imported globally
interface Tag { id: number; name: string; }

// Zod Schema including initialScore
const baseSkillSchema = z.object({
    name: z.string().min(1, 'Required').max(100),
    description: z.string().max(500).optional().nullable(),
    maxScore: z.coerce.number().int().min(1, 'Max score >= 1').max(1000, 'Max score too high').default(10),
    initialScore: z.coerce.number().int().min(0).optional().nullable(), // Optional score for first log
    categoryId: z.coerce.number().int().positive().optional().nullable(),
    ratingScaleType: z.string().default('numeric'),
    tags: z.array(z.string()).max(10, "Maximum 10 tags").optional().default([]),
    ownership: z.enum(['personal', 'team']).default('personal'),
    teamId: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),
}).refine(data => (data.initialScore === null || data.initialScore === undefined) || (data.initialScore >= 0 && data.initialScore <= (data.maxScore ?? 10)), {
    message: "Initial score cannot exceed max score", path: ["initialScore"],
}).refine(data => data.ownership === 'personal' || (data.ownership === 'team' && data.teamId != null), {
    message: "Please select a team", path: ["teamId"],
});

// Define form data type
export type SkillFormData = z.infer<typeof baseSkillSchema>;

interface SkillFormProps {
    initialData?: Partial<Omit<SkillFormData, 'initialScore' | 'ownership' | 'teamId'>>; // Edit initial data shouldn't include these
    onSubmit: SubmitHandler<SkillFormData>;
    onCancel: () => void;
    isSubmitting: boolean;
    mode: 'add' | 'edit';
    onManageCategories: () => void; // Handler to open full category manager
    onAddCategory: () => void; // Handler to open quick add category modal
    categoryVersion: number; // To trigger refetch
}

const SkillForm: React.FC<SkillFormProps> = ({
    initialData, onSubmit, onCancel, isSubmitting, mode,
    onManageCategories, // Destructure manage handler
    onAddCategory,    // Destructure add handler
    categoryVersion
}) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [existingTags, setExistingTags] = useState<Tag[]>([]);
    const [userOwnedTeams, setUserOwnedTeams] = useState<UserTeamListItem[]>([]);
    const [loadingFormData, setLoadingFormData] = useState(false);
    const [dataFetchError, setDataFetchError] = useState<string | null>(null);

    const { control, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm<SkillFormData>({
         resolver: zodResolver(baseSkillSchema), // Apply schema directly
        defaultValues: { // Define ALL defaults clearly
            name: '', description: '', maxScore: 10, ratingScaleType: 'numeric',
            categoryId: null, tags: [], notes: '',
            ownership: 'personal', teamId: null, initialScore: null, // Default initialScore null
            // Spread initial data ONLY in edit mode, AFTER defaults
            ...(mode === 'edit' ? initialData : {})
        },
    });

    // Watch values
    const initialScoreValue = watch('initialScore');
    const maxScoreValue = watch('maxScore');
    const ownershipValue = watch('ownership');

    // Data Fetching Effect
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!isMounted) return;
            setLoadingFormData(true); setDataFetchError(null);
            try {
                const teamPromise = (mode === 'add' && user) ? fetchUserTeams() : Promise.resolve([]);
                const [catData, tagData, teamData] = await Promise.all([ fetchCategories(), fetchTags(), teamPromise ]);
                if (isMounted) {
                    setCategories(catData);
                    setExistingTags(tagData);
                    setUserOwnedTeams(teamData.filter(team => team.ownerId === user?.id));
                }
            } catch (error: any) {
                if (isMounted) setDataFetchError("Could not load form data.");
                console.error("Form Data Fetch Error:", error);
             } finally {
                if (isMounted) setLoadingFormData(false);
            }
        };
        fetchData();
        return () => { isMounted = false; } // Cleanup
    }, [mode, user, categoryVersion]); // Add categoryVersion dependency

    // Form Reset Effect
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            reset({ // Reset only fields relevant to editing
                name: initialData.name ?? '',
                description: initialData.description ?? '',
                maxScore: initialData.maxScore ?? 10,
                categoryId: initialData.categoryId ?? null,
                ratingScaleType: initialData.ratingScaleType ?? 'numeric',
                tags: initialData.tags || [],
                notes: initialData.notes || '',
                // Force reset non-editable fields for edit mode
                ownership: 'personal', teamId: null, initialScore: null,
            });
        } else if (mode === 'add') {
             // Reset to blank defaults for adding
             reset({
                 name: '', description: '', initialScore: null, maxScore: 10,
                 ratingScaleType: 'numeric', categoryId: null, tags: [],
                 ownership: 'personal', teamId: null, notes: '',
             });
        }
    }, [initialData, mode, reset]);

    // Auto-select team if only one owned
    useEffect(() => {
        if (mode === 'add' && ownershipValue === 'team' && userOwnedTeams.length === 1) {
             setValue('teamId', userOwnedTeams[0].id, { shouldValidate: true });
        }
        // Optional: Reset teamId if switching ownership back to personal?
        // if (mode === 'add' && ownershipValue === 'personal') {
        //     setValue('teamId', null);
        // }
    }, [mode, ownershipValue, userOwnedTeams, setValue]);

    // Dynamic Score Validation Schema for Initial Score
     const scoreValidationSchema = z.coerce
        .number({ invalid_type_error: 'Score must be a number' })
        .min(0, { message: 'Score cannot be negative' })
        .max(isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue, {
            message: `Score cannot exceed max score (${isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue})`
        });

    // --- Render ---
    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            {loadingFormData && <CircularProgress size={20} sx={{ display: 'block', margin: 'auto', mb: 2 }} />}
            {dataFetchError && <Alert severity="error" sx={{ mb: 2 }}>{dataFetchError}</Alert>}

            {/* Ownership Selection */}
            {mode === 'add' && userOwnedTeams.length > 0 && (
                <FormControl component="fieldset" margin="normal" disabled={isSubmitting || loadingFormData}>
                    <Typography variant="subtitle1" component="legend" sx={{ mb: 1 }}>Skill Ownership</Typography>
                    <Controller name="ownership" control={control} render={({ field }) => ( <RadioGroup row {...field}> <FormControlLabel value="personal" control={<Radio />} label="Personal Skill" /> <FormControlLabel value="team" control={<Radio />} label="Team Skill" /> </RadioGroup> )} />
                </FormControl>
            )}

            {/* Team Selection Dropdown */}
             {mode === 'add' && ownershipValue === 'team' && (
                 <FormControl fullWidth margin="normal" required disabled={isSubmitting || loadingFormData} error={!!errors.teamId}>
                    <InputLabel id="team-select-label">Select Team</InputLabel>
                    <Controller name="teamId" control={control} render={({ field }) => ( <Select {...field} labelId="team-select-label" label="Select Team *" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} > <MenuItem value="" disabled><em>Select a team...</em></MenuItem> {userOwnedTeams.map((team) => ( <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem> ))} </Select> )} />
                     {errors.teamId && <Typography color="error" variant="caption" sx={{ml: 2}}>{errors.teamId.message}</Typography>}
                 </FormControl>
             )}

            {/* Category Select with Add/Manage Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <FormControl fullWidth margin="normal" disabled={isSubmitting || loadingFormData} sx={{ flexGrow: 1 }}>
                    <InputLabel id="category-select-label">Category (Optional)</InputLabel>
                    <Controller name="categoryId" control={control} defaultValue={null}
                        render={({ field }) => (
                            <Select {...field} labelId="category-select-label" label="Category (Optional)" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} >
                                 <MenuItem value=""><em>None</em></MenuItem>
                                 {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                                 {categories.length === 0 && <MenuItem disabled>No categories found</MenuItem>}
                            </Select>
                         )} />
                 </FormControl>
                 <Tooltip title="Add New Category">
                     <IconButton onClick={onAddCategory} aria-label="add category" sx={{ mb: 1 }}>
                         <AddCircleOutlineIcon />
                     </IconButton>
                 </Tooltip>
                 <Tooltip title="Manage Categories">
                    <IconButton onClick={onManageCategories} aria-label="manage categories" sx={{ mb: 1 }}>
                        <SettingsIcon />
                    </IconButton>
                 </Tooltip>
            </Box>
             {errors.categoryId && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.categoryId.message}</Typography>}

            {/* Name */}
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} margin="normal" required fullWidth label="Skill Name" autoFocus={mode === 'add' && ownershipValue === 'personal'} error={!!errors.name} helperText={errors.name?.message} disabled={isSubmitting || loadingFormData} />} />
            {/* Description */}
            <Controller name="description" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} margin="normal" fullWidth label="Description (Optional)" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} disabled={isSubmitting || loadingFormData} />} />
            {/* Tags */}
            <Controller name="tags" control={control} defaultValue={[]} render={({ field }) => ( <Autocomplete multiple options={existingTags.map(t => t.name)} value={field.value || []} freeSolo disabled={isSubmitting || loadingFormData} onChange={(_, v) => field.onChange([...new Set(v.map(val => typeof val === 'string' ? val.trim() : val))].filter(Boolean))} renderTags={(v, getTagProps) => v.map((o, i) => (<Chip {...getTagProps({ index: i })} variant="outlined" label={o} size="small"/>))} renderInput={(p) => (<TextField {...p} variant="outlined" label="Tags (Optional)" margin="normal" error={!!errors.tags} helperText={errors.tags?.message} />)} /> )} />
            {/* Notes */}
            <Controller name="notes" control={control} render={({ field }) => ( <TextField {...field} value={field.value || ''} margin="normal" fullWidth id="notes" label={mode === 'add' ? "Initial Notes (Optional)" : "Notes (Optional)"} multiline rows={2} error={!!errors.notes} helperText={errors.notes?.message || (mode === 'add' ? "Optionally add notes about the initial score." : "")} disabled={isSubmitting || loadingFormData} /> )} />

            {/* Scores */}
             <Controller name="maxScore" control={control} render={({ field }) => <TextField {...field} margin="normal" required fullWidth label="Maximum Score" type="number" inputProps={{ min: 1, max: 1000 }} error={!!errors.maxScore} helperText={errors.maxScore?.message || "Highest possible score"} disabled={isSubmitting || loadingFormData} />} />
             {/* Initial Score Slider (Only in ADD mode) */}
             {mode === 'add' && (
                 <Box sx={{ mt: 2, mb: 1 }}>
                     <Typography gutterBottom> Initial Score ({initialScoreValue ?? '--'} / {maxScoreValue || 10}) </Typography>
                     <Controller name="initialScore" control={control}
                          rules={{ validate: value => { if (value === null || value === undefined || value === null) return true; const result = scoreValidationSchema.safeParse(value); return result.success || result.error?.errors?.[0]?.message || 'Invalid score'; } }}
                         render={({ field }) => ( <Slider {...field} value={field.value ?? 0} valueLabelDisplay="auto" step={1} marks min={0} max={isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue} disabled={isSubmitting || isNaN(maxScoreValue) || maxScoreValue < 1 || loadingFormData} onChange={(_, v) => field.onChange(v) } /> )} />
                     {errors.initialScore && <Typography color="error" variant="caption">{errors.initialScore.message}</Typography>}
                     <Typography variant="caption" display="block" color="text.secondary">Set starting score (optional) - further changes via progress logs.</Typography>
                 </Box>
             )}

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