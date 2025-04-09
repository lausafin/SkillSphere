// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
// Removed Alert, Divider from import - Keep others
import { Box, Typography, Paper, TextField, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth(); // Get user and loading state
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Removed unused error and success state variables for profile update,
    // as the actual update logic is currently placeholder.
    // Add them back when implementing the actual API call and feedback.
    // const [error, setError] = useState<string | null>(null);
    // const [success, setSuccess] = useState<string | null>(null);


    // Initialize name state when user data is available
    useEffect(() => {
        if (user) {
            setName(user.name || '');
        }
    }, [user]);


    const handleSave = async () => {
         if (!user) return;
        setIsSubmitting(true);
        // setError(null); setSuccess(null); // Remove if state variables removed
        try {
            // --- Placeholder for API call ---
            console.log("Attempting to update profile name to:", name);
            // await updateUserProfile(user.id, { name }); // 1. Call API
            // updateUser({ ...user, name: name }); // 2. Update context state
             // --- End Placeholder ---
            // setSuccess('Profile update simulated!'); // Remove if state variables removed
            alert('Profile update simulated! Check console.'); // Simple alert for now
        } catch (err: any) {
            // setError(err.response?.data?.message || 'Failed to update profile.'); // Remove if state variable removed
            alert('Failed to simulate profile update.'); // Simple alert for now
            console.error("Profile save error (simulated):", err);
        }
        finally { setIsSubmitting(false); }
    };

    // Display loading spinner while auth state is loading or user isn't available yet
    if (authLoading || !user) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)">
                 <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
                <Typography variant="h4" gutterBottom>My Profile</Typography>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}> {/* Profile Section */}
                    {/* Removed Alert components for error/success as they were tied to unused state */}
                    <TextField fullWidth margin="normal" label="Email Address" value={user.email} disabled variant="filled" />
                    <TextField fullWidth margin="normal" label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}> (Password change functionality coming soon...) </Typography>
                    <Button variant="contained" sx={{ mt: 3 }} onClick={handleSave} disabled={isSubmitting || name === (user.name || '')}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Save Profile Changes'}
                    </Button>
                </Paper>

            </Box>
        </>
    );
};

export default ProfilePage;