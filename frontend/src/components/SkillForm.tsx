// src/components/SkillForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    TextField, Button, Box, Slider, Typography, FormControl, InputLabel,
    Select, MenuItem, Autocomplete, Chip, CircularProgress, Alert
} from '@mui/material';
import { fetchCategories, fetchTags } from '../services/api';

// Define Category and Tag types locally or import
interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

// Update Zod schema - ensure maxScore validation uses the watched value correctly
// We define a base schema and refine it later inside the component for dynamic maxScore
const baseSkillSchema = z.object({
    name: z.string().min(1, { message: 'Skill name is required' }).max(100),
    description: z.string().max(500).optional().nullable(),
    maxScore: z.coerce.number().int().min(1, 'Max score must be at least 1').max(100).default(10),
    currentScore: z.coerce.number().int().min(0).default(0), // Base validation
    categoryId: z.coerce.number().int().positive().optional().nullable(),
    ratingScaleType: z.string().default('numeric'),
    tags: z.array(z.string()).max(10, "Maximum 10 tags").optional().default([]),
});

// Define form data type based on base schema
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [existingTags, setExistingTags] = useState<Tag[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);
    const [dataFetchError, setDataFetchError] = useState<string | null>(null);

    // Get the watched value for maxScore *outside* the useForm hook definition
    // but before defining the final schema resolver
    // const tempMaxScore = initialData?.maxScore ?? 10; // Use initial data or default for initial validation setup

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<SkillFormData>({
        resolver: zodResolver(
            // Refine the base schema dynamically
            baseSkillSchema.refine(data => data.currentScore <= data.maxScore, {
                message: "Current score cannot exceed max score",
                path: ["currentScore"],
            })
        ),
        defaultValues: { // Provide all defaults explicitly
            name: '', description: '', currentScore: 0, maxScore: 10,
            ratingScaleType: 'numeric', categoryId: null, tags: [],
            ...initialData // Spread initial data last to override defaults
        },
    });

    const currentScoreValue = watch('currentScore');
    const maxScoreValue = watch('maxScore'); // This is now reactive

    // Fetch data effect
    useEffect(() => {
        const fetchData = async () => { /* ... same as in previous version ... */
            setLoadingCategories(true); setLoadingTags(true); setDataFetchError(null);
            try {
                const [catData, tagData] = await Promise.all([fetchCategories(), fetchTags()]);
                setCategories(catData); setExistingTags(tagData);
            } catch (error: any) { console.error("Fetch Error:", error); setDataFetchError("Could not load form data."); }
            finally { setLoadingCategories(false); setLoadingTags(false); }
        };
        fetchData();
    }, []);

    // Reset effect
    useEffect(() => {
        if (initialData) {
            const initialFormValues = {
                ...initialData,
                tags: initialData.tags || [],
                categoryId: initialData.categoryId === undefined ? null : initialData.categoryId,
                // Ensure all fields from defaultValues are present if not in initialData
                 name: initialData.name ?? '',
                 description: initialData.description ?? '',
                 currentScore: initialData.currentScore ?? 0,
                 maxScore: initialData.maxScore ?? 10,
                 ratingScaleType: initialData.ratingScaleType ?? 'numeric',
            };
            reset(initialFormValues);
        } else {
            // Reset to complete default values when switching to 'add' mode or initially
             reset({
                 name: '', description: '', currentScore: 0, maxScore: 10,
                 ratingScaleType: 'numeric', categoryId: null, tags: [],
            });
        }
    }, [initialData, reset]);

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            {/* Loading/Error indicators */}
            {(loadingCategories || loadingTags) && <CircularProgress size={20} sx={{ display: 'block', margin: 'auto', mb: 2 }} />}
            {dataFetchError && <Alert severity="error" sx={{ mb: 2 }}>{dataFetchError}</Alert>}

            {/* Name */}
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} margin="normal" required fullWidth label="Skill Name" autoFocus error={!!errors.name} helperText={errors.name?.message} disabled={isSubmitting || loadingCategories || loadingTags} />} />
            {/* Description */}
            <Controller name="description" control={control} render={({ field }) => <TextField {...field} value={field.value || ''} margin="normal" fullWidth label="Description (Optional)" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} disabled={isSubmitting || loadingCategories || loadingTags} />} />

            {/* Category Select */}
            <FormControl fullWidth margin="normal" disabled={isSubmitting || loadingCategories}>
                <InputLabel id="category-select-label">Category (Optional)</InputLabel>
                <Controller
                    name="categoryId" control={control} defaultValue={null}
                    render={({ field }) => (
                        <Select {...field} labelId="category-select-label" label="Category (Optional)" value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                        </Select>
                    )} />
                 {errors.categoryId && <Typography color="error" variant="caption">{errors.categoryId.message}</Typography>}
            </FormControl>

            {/* Tags Autocomplete */}
            <Controller name="tags" control={control} defaultValue={[]}
                render={({ field }) => (
                    <Autocomplete multiple id="tags-autocomplete" options={existingTags.map(tag => tag.name)} value={field.value || []} freeSolo disabled={isSubmitting || loadingTags}
                        onChange={(_, newValue) => {
                            const uniqueValues = [...new Set(newValue.map(val => typeof val === 'string' ? val.trim() : val))].filter(Boolean);
                            field.onChange(uniqueValues);
                        }}
                        renderTags={(value: readonly string[], getTagProps) => value.map((option: string, index: number) => (
                            <Chip variant="outlined" label={option} {...getTagProps({ index })} /> ))}
                        renderInput={(params) => (
                            <TextField {...params} variant="outlined" label="Tags (Optional)" placeholder="Add or select tags" margin="normal" error={!!errors.tags} helperText={errors.tags?.message} />
                        )} />
                )} />

            {/* Max Score */}
            <Controller name="maxScore" control={control} render={({ field }) => <TextField {...field} margin="normal" required fullWidth label="Maximum Score" type="number" inputProps={{ min: 1, max: 100 }} error={!!errors.maxScore} helperText={errors.maxScore?.message || "Highest possible score"} disabled={isSubmitting || loadingCategories || loadingTags} />} />

            {/* Current Score Slider */}
            <Box sx={{ mt: 2, mb: 1 }}>
                <Typography gutterBottom>Current Score ({currentScoreValue} / {maxScoreValue || 10})</Typography>
                <Controller name="currentScore" control={control}
                    render={({ field }) => ( <Slider {...field} aria-labelledby="current-score-slider" valueLabelDisplay="auto" step={1} marks min={0} max={isNaN(maxScoreValue) || maxScoreValue < 1 ? 10 : maxScoreValue} disabled={isSubmitting || isNaN(maxScoreValue) || maxScoreValue < 1 || loadingCategories || loadingTags} onChange={(_, value) => field.onChange(value)} /> )} />
                {errors.currentScore && <Typography color="error" variant="caption">{errors.currentScore.message}</Typography>}
            </Box>

            {/* Buttons */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting || loadingCategories || loadingTags}>
                    {isSubmitting ? 'Saving...' : (mode === 'add' ? 'Add Skill' : 'Update Skill')}
                </Button>
            </Box>
        </Box>
    );
};

export default SkillForm;