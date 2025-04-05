// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
// Assume API function exists - needs implementation in api.ts and backend
// import { updateUserProfile } from '../services/api';
// Assume AuthContext has an updateUser function - needs implementation
// const { user, isLoading: authLoading, updateUser } = useAuth();

const ProfilePage: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth(); // Get user and loading state
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Initialize name state when user data is available
    useEffect(() => {
        if (user) {
            setName(user.name || '');
        }
    }, [user]);


    const handleSave = async () => {
         if (!user) return;
        setIsSubmitting(true); setError(null); setSuccess(null);
        try {
            // --- Placeholder for API call ---
            console.log("Attempting to update profile name to:", name);
            // await updateUserProfile(user.id, { name }); // 1. Call API
            // updateUser({ ...user, name: name }); // 2. Update context state (implement this in AuthContext)
             // --- End Placeholder ---
            setSuccess('Profile update simulated! (API/Context update needed)'); // Placeholder success
        } catch (err: any) { setError(err.response?.data?.message || 'Failed to update profile.'); }
        finally { setIsSubmitting(false); }
    };

    if (authLoading || !user) { /* ... Loading spinner ... */
        return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
    }

    return (
        <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>My Profile</Typography>
            <Paper elevation={2} sx={{ p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <TextField fullWidth margin="normal" label="Email Address" value={user.email} disabled variant="filled" />
                <TextField fullWidth margin="normal" label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}> (Password change functionality coming soon...) </Typography>
                <Button variant="contained" sx={{ mt: 3 }} onClick={handleSave} disabled={isSubmitting || name === (user.name || '')}>
                    {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
};
export default ProfilePage;