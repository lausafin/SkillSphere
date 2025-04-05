// src/components/AppHeader.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Tooltip, Divider } from '@mui/material';
import { useNavigate, NavLink } from 'react-router-dom';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

const AppHeader: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    // --- Menu Handlers ---
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLogout = () => { handleClose(); logout(); navigate('/login'); };
    const handleProfile = () => { handleClose(); navigate('/profile'); };

    // Define active/default styles for NavLink
    const activeNavLinkStyle: React.CSSProperties = { fontWeight: 'bold', textDecoration: 'underline', color: 'inherit' };
    const defaultNavLinkStyle: React.CSSProperties = { textDecoration: 'none', color: 'inherit' };

    return (
        <AppBar position="static">
            <Toolbar>
                {/* App Title/Logo */}
                <Typography variant="h6" component={NavLink} to={isAuthenticated ? "/dashboard" : "/login"} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                    SkillSphere
                </Typography>

                {/* Desktop Navigation Links */}
                {isAuthenticated && (
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeNavLinkStyle : defaultNavLinkStyle}>
                            <Button color="inherit"> Dashboard </Button>
                        </NavLink>
                        <NavLink to="/skills" style={({ isActive }) => isActive ? activeNavLinkStyle : defaultNavLinkStyle}>
                            <Button color="inherit"> My Skills </Button>
                        </NavLink>
                    </Box>
                )}

                {/* Login/Register or User Menu */}
                {isAuthenticated && user ? (
                    <div>
                        <Tooltip title="Account Settings">
                           {/* ... IconButton ... */}
                           <IconButton size="large" onClick={handleMenu} color="inherit"> <AccountCircle /> <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', sm: 'inline' } }}> {user.name || user.email} </Typography> </IconButton>
                        </Tooltip>
                        <Menu id="menu-appbar" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} /* ... */ >

                            {/* --- Mobile Menu Items (Corrected) --- */}
                            <NavLink
                                to="/dashboard"
                                style={({ isActive }: { isActive: boolean }) => isActive ? activeNavLinkStyle : defaultNavLinkStyle}
                            >
                                <MenuItem onClick={handleClose} sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>
                                     {/* Apply width: 100% to MenuItem to make NavLink click area fill it */}
                                    Dashboard
                                </MenuItem>
                            </NavLink>
                            <NavLink
                                to="/skills"
                                style={({ isActive }: { isActive: boolean }) => isActive ? activeNavLinkStyle : defaultNavLinkStyle}
                            >
                                <MenuItem onClick={handleClose} sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>
                                    My Skills
                                </MenuItem>
                            </NavLink>
                            {/* --- End Mobile Menu Items Correction --- */}

                            <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                            <MenuItem onClick={handleProfile}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </div>
                ) : ( <Box> <Button component={NavLink} to="/login" color="inherit"> Login </Button> <Button component={NavLink} to="/register" color="inherit"> Register </Button> </Box> )}
            </Toolbar>
        </AppBar>
    );
};

export default AppHeader;