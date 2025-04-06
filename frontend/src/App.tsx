// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react'; // Import Suspense and lazy
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, CssBaseline, createTheme, Box, CircularProgress } from '@mui/material';
import AppHeader from './components/AppHeader'; // Import AppHeader component
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute component

// Basic theme example
const theme = createTheme({
  palette: {
    mode: 'light', // Or 'dark'
  },
});

// Dynamically import pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SkillList = lazy(() => import('./components/SkillList')); // Assuming SkillList is page-like
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));


export default function App() {
  return (
    <ThemeProvider theme={theme}> <CssBaseline />
    <AuthProvider> <Router> <AppHeader />
      {/* Wrap Routes with Suspense for loading fallback */}
      <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" height="calc(100vh - 64px)"><CircularProgress /></Box>}>
        <Routes>
           {/* Render lazily loaded components */}
           <Route path="/login" element={<LoginPage />} />
           <Route path="/register" element={<RegisterPage />} />
           <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
           <Route path="/skills" element={<ProtectedRoute><SkillList /></ProtectedRoute>} />
           <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
           <Route path="/" element={<Navigate replace to="/dashboard" />} />
           <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router> </AuthProvider>
    </ThemeProvider>
  );
}