// src/pages/RegisterPage.tsx
import React, { useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Remove useNavigate if no longer needed here
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Keep useNavigate for potential redirect check
import { Container, Box, TextField, Button, Typography, CircularProgress, Alert, Link, Paper } from '@mui/material';

// Register form schema
const registerSchema = z.object({
    name: z.string().optional(),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"], });
type RegisterFormInputs = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
    // Get register function, isLoading, error state, AND isAuthenticated
    const { register, isLoading, error: authError, clearError, isAuthenticated } = useAuth();
    const navigate = useNavigate(); // Keep navigate for redirect check

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });

    // Redirect if user becomes authenticated (after successful registration)
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true }); // Redirect to dashboard on successful login/registration
        }
    }, [isAuthenticated, navigate]);

    // Clear error on mount
    useEffect(() => { clearError(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
        // setRegistrationSuccess(false); // Removed
        try {
            const { confirmPassword, ...registerData } = data;
            await register(registerData);
            // SUCCESS: No need to do anything here, the useEffect above will handle redirect
            // setRegistrationSuccess(true); // Removed
        } catch (err) {
            console.error("Register attempt failed in component:", err);
            // Error is set in AuthContext and displayed via authError state below
            // setRegistrationSuccess(false); // Removed
        }
    };
    
    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 4 }}>
                <Typography component="h1" variant="h5"> Sign Up </Typography>
                 <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1, width: '100%' }}>
                        {authError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}> {authError} </Alert>}
                         <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} margin="normal" fullWidth id="name" label="Name (Optional)" autoComplete="name" disabled={isSubmitting} error={!!errors.name} helperText={errors.name?.message} /> )} />
                         <Controller name="email" control={control} render={({ field }) => ( <TextField {...field} margin="normal" required fullWidth id="email" label="Email Address" autoComplete="email" error={!!errors.email} helperText={errors.email?.message} disabled={isSubmitting} /> )} />
                         <Controller name="password" control={control} render={({ field }) => ( <TextField {...field} margin="normal" required fullWidth label="Password" type="password" id="password" error={!!errors.password} helperText={errors.password?.message} disabled={isSubmitting} /> )} />
                         <Controller name="confirmPassword" control={control} render={({ field }) => ( <TextField {...field} margin="normal" required fullWidth label="Confirm Password" type="password" id="confirmPassword" error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} disabled={isSubmitting} /> )} />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isSubmitting || isLoading}> {isSubmitting || isLoading ? <CircularProgress size={24} /> : 'Sign Up'} </Button>
                         <Box sx={{ textAlign: 'center' }}> <Link component={RouterLink} to="/login" variant="body2"> {"Already have an account? Sign In"} </Link> </Box>
                    </Box>
            </Paper>
        </Container>
    );
};
export default RegisterPage;