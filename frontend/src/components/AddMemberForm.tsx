// src/components/AddMemberForm.tsx (New File)
import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addTeamMember, TeamRole } from '../services/api'; // Import API and Enum

// Schema for adding member
const addMemberSchema = z.object({
    email: z.string().email('Invalid email address'),
    // Role is optional, backend defaults to MEMBER
    role: z.nativeEnum(TeamRole).optional(), // Validate against Prisma Enum if imported
});
type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberFormProps {
    teamId: number;
    onMemberAdded: () => void; // Callback to refresh member list
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ teamId, onMemberAdded }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { control, handleSubmit, reset, formState: { errors } } = useForm<AddMemberFormData>({
        resolver: zodResolver(addMemberSchema), defaultValues: { email: '', role: TeamRole.MEMBER } // Default role selection
    });

    const onSubmit: SubmitHandler<AddMemberFormData> = async (data) => {
        setIsSubmitting(true); setError(null);
        try {
            await addTeamMember(teamId, { email: data.email, role: data.role });
            reset(); // Clear form
            onMemberAdded(); // Trigger list refresh
             alert('Member added successfully!'); // Simple feedback
        } catch (err: any) {
            console.error("Add member error:", err);
            setError(err.response?.data?.message || 'Failed to add member.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: 'flex-start', mb: 2 }}>
            <Controller name="email" control={control} render={({ field }) => (
                <TextField {...field} required fullWidth label="Member Email" type="email" size="small" error={!!errors.email} helperText={errors.email?.message} disabled={isSubmitting} sx={{ flexGrow: 1 }} />
             )}/>
            {/* Optional Role Selection */}
            <FormControl size="small" sx={{minWidth: 120}}>
                <InputLabel id={`role-select-label-${teamId}`}>Role</InputLabel>
                 <Controller name="role" control={control}
                    render={({ field }) => (
                         <Select {...field} labelId={`role-select-label-${teamId}`} label="Role" disabled={isSubmitting} >
                             <MenuItem value={TeamRole.MEMBER}>Member</MenuItem>
                             <MenuItem value={TeamRole.LEADER}>Leader</MenuItem>
                             {/* Add other roles here */}
                         </Select>
                     )} />
            </FormControl>

            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ height: '40px' /* Match TextField small height */ }}>
                 {isSubmitting ? <CircularProgress size={24} /> : 'Add Member'}
            </Button>
             {error && <Alert severity="error" sx={{ width: '100%', mt: 1 }}>{error}</Alert>}
        </Box>
    );
};

export default AddMemberForm;