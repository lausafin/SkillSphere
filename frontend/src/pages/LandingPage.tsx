// src/pages/LandingPage.tsx
import React, { useEffect } from 'react'; // Added useEffect for redirect logic
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Added useNavigate
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../context/AuthContext'; // Added useAuth for redirect

// Optional: Define gradient styles separately or directly in sx
// const heroGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Example Purple/Blue Gradient
// const heroGradientSubtle = 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'; // Lighter example
// const heroGradientGreen = 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)'; // Another blue/purple option


const LandingPage: React.FC = () => {
    // Redirect if already authenticated
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    return (
        <Box> {/* Main container */}
            {/* --- Hero Section --- */}
            <Box
                sx={{
                    minHeight: '70vh', // Take significant vertical space
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 6, md: 10 }, // Vertical padding responsive
                    // Background Gradient - Choose one or create your own
                    // background: heroGradient,
                    background: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)', // Subtle Grey
                    // background: 'linear-gradient(to right, #74ebd5 0%, #acb6e5 100%)', // Soft Teal/Blue
                    color: 'text.primary', // Ensure text is readable on background
                     textAlign: 'center',
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' }, // Responsive font size
                            // Optional: Text gradient (can be tricky with compatibility)
                            // background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
                            // WebkitBackgroundClip: 'text',
                            // WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Track Your Progress. <br /> Master Your Skills.
                    </Typography>
                    <Typography
                        variant="h6"
                        component="p"
                        color="text.secondary" // Use secondary text color for contrast
                        sx={{
                             mb: 4, // Margin bottom for spacing before buttons
                             maxWidth: '700px', // Limit line length for readability
                             mx: 'auto', // Center the paragraph block
                             fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem'},
                        }}
                    >
                        SkillSphere offers a clean, minimalist interface to visualize your learning journey across any discipline. Log scores, see trends, and stay motivated.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            color="primary" // Use theme primary color
                            size="large"
                            component={RouterLink}
                            to="/register" // Link to registration page
                            endIcon={<ArrowForwardIcon />}
                            sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }} // Custom padding/size
                        >
                            Get Started Free
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary" // Use theme primary color for outline too
                            size="large"
                            component={RouterLink}
                            to="/login" // Link to login page
                            startIcon={<LoginIcon />}
                             sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
                        >
                            Login
                        </Button>
                    </Box>
                </Container>
            </Box>

             {/* --- Features Section (Placeholder) --- */}
             <Container sx={{ py: 8 }} maxWidth="md">
                 <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6, fontWeight: 600 }}>
                    How It Works
                 </Typography>
                 <Grid container spacing={4}>
                     {/* Feature 1 */}
                     <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                         {/* Placeholder for Icon */}
                         <Box sx={{ fontSize: '4rem', mb: 2, color: 'primary.main' }}>🎯</Box>
                         <Typography variant="h6" gutterBottom>Define Skills</Typography>
                         <Typography color="text.secondary">Add any skill you're learning, from programming to painting.</Typography>
                     </Grid>
                     {/* Feature 2 */}
                     <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                         {/* Placeholder for Icon */}
                         <Box sx={{ fontSize: '4rem', mb: 2, color: 'primary.main' }}>📝</Box>
                         <Typography variant="h6" gutterBottom>Log Progress</Typography>
                         <Typography color="text.secondary">Update scores and notes easily as you practice and improve.</Typography>
                     </Grid>
                     {/* Feature 3 */}
                     <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                         {/* Placeholder for Icon */}
                         <Box sx={{ fontSize: '4rem', mb: 2, color: 'primary.main' }}>📈</Box>
                         <Typography variant="h6" gutterBottom>Visualize Growth</Typography>
                         <Typography color="text.secondary">See your journey unfold with clear lists and insightful charts.</Typography>
                     </Grid>
                 </Grid>
             </Container>


             {/* --- Final CTA Section (Placeholder) --- */}
             <Box sx={{ py: 8, backgroundColor: 'action.hover' /* Light grey background */ }}>
                 <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                     <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        Ready to See Your Progress?
                     </Typography>
                     <Button variant="contained" size="large" component={RouterLink} to="/register" sx={{ mt: 2, py: 1.5, px: 5, fontSize: '1.1rem' }}>
                         Sign Up Now
                     </Button>
                 </Container>
             </Box>

            {/* --- Footer (Placeholder) --- */}
            <Box component="footer" sx={{ py: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
                 <Typography variant="body2" color="text.secondary">
                     © {new Date().getFullYear()} SkillSphere
                 </Typography>
                 {/* Add links later if needed */}
             </Box>

        </Box> // End main container
    );
};


export default LandingPage;