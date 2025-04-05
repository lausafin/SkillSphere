// src/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom'; // Added useLocation
import { Container, Box, TextField, Button, Typography, CircularProgress, Alert, Link, Paper } from '@mui/material';

// Login form schema
const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const { login, isAuthenticated, isLoading, error: authError, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Get location

    // Determine where to redirect after login
    const from = location.state?.from?.pathname || '/dashboard'; // Default to dashboard

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true }); // Use 'from' location
        }
    }, [isAuthenticated, navigate, from]);

    // Clear error on mount
    useEffect(() => { clearError(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
        try { await login(data); /* Navigation handled by useEffect */ }
        catch (err) { console.error("Login Comp Err:", err); }
    };

    // Initial load check
    if (isLoading && !isAuthenticated) { /* ... Loading spinner ... */
        return <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)"><CircularProgress /></Box>;
    }
    if (isAuthenticated) return null; // Don't render if logged in

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 4 }}>
                <Typography component="h1" variant="h5"> Sign In </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1, width: '100%' }}>
                    {authError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}> {authError} </Alert>}
                     <Controller name="email" control={control} render={({ field }) => ( <TextField {...field} margin="normal" required fullWidth id="email" label="Email Address" autoComplete="email" autoFocus error={!!errors.email} helperText={errors.email?.message} disabled={isSubmitting} /> )} />
                     <Controller name="password" control={control} render={({ field }) => ( <TextField {...field} margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" error={!!errors.password} helperText={errors.password?.message} disabled={isSubmitting} /> )} />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'} </Button>
                     <Box sx={{ textAlign: 'center' }}> <Link component={RouterLink} to="/register" variant="body2"> {"Don't have an account? Sign Up"} </Link> </Box>
                </Box>
            </Paper>
        </Container>
    );
};
export default LoginPage;