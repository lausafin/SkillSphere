// src/App.tsx
// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

// Pages & Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SkillList from './components/SkillList';
import ProtectedRoute from './components/ProtectedRoute';
import AppHeader from './components/AppHeader';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Basic theme example
const theme = createTheme({
  palette: {
    // mode: 'light', // Or 'dark'
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppHeader />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/skills" element={<ProtectedRoute><SkillList /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Default Route */}
            <Route path="/" element={<Navigate replace to="/dashboard" />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;