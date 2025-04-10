// src/App.tsx
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Import useLocation if using ProtectedRoute logic here
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme'; // Assuming your theme is defined here

// Import Header
import AppHeader from './components/AppHeader';

// Dynamically import pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SkillList = lazy(() => import('./components/SkillList'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const TeamDashboardPage = lazy(() => import('./pages/TeamDashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LandingPage = lazy(() => import('./pages/LandingPage')); // <-- Import Landing Page

// Updated Protected Route (can be kept separate or logic merged here)
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)"><CircularProgress /></Box>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
};

// Component to handle root redirection
const RootRedirect = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) { // Show loading while checking auth for root path
        return <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)"><CircularProgress /></Box>;
    }
    // If logged in, go to dashboard, otherwise go to landing page
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/welcome" replace />;
};

// Component to prevent authenticated users from accessing public-only pages
const PublicRoute = ({ children }: { children: JSX.Element }) => {
     const { isAuthenticated, isLoading } = useAuth();
     if (isLoading) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)"><CircularProgress /></Box>;
     }
     // If authenticated, redirect away from public-only page (e.g., login/register/landing)
     return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AuthProvider needs to wrap Router */}
      <AuthProvider>
        <Router>
          <AppHeader />
           <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)"><CircularProgress /></Box>}>
            <Routes>
                {/* Public Routes - Redirect if logged in */}
                <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/skills" element={<ProtectedRoute><SkillList /></ProtectedRoute>} />
                <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
                <Route path="/teams/:teamId" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Root Route Handler */}
                <Route path="/" element={<RootRedirect />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;