// src/pages/NotFoundPage.tsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Check auth status for correct link

const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth(); // Check if user is logged in

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)', // Adjust header height if needed
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom sx={{ color: 'text.secondary' }}>
        404
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Oops! Page Not Found.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Sorry, the page you are looking for does not exist or may have been moved.
      </Typography>
      <Button
         component={RouterLink}
         // Link to dashboard if logged in, otherwise login page
         to={isAuthenticated ? "/dashboard" : "/login"}
         variant="contained"
         color="primary"
         size="large"
       >
         {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
       </Button>
    </Box>
  );
};

export default NotFoundPage;