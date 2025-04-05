// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
// Adjust import path as needed
import apiClient, { fetchProfile, loginUser, registerUser, LoginDto, RegisterDto, UserProfile, AuthResponse } from '../services/api';

// Define User shape used within the context
interface User { id: number; email: string; name?: string | null; }

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: LoginDto) => Promise<void>;
    logout: () => void;
    register: (details: RegisterDto) => Promise<{user: UserProfile} | void>; // Return user or void
    error: string | null;
    clearError: () => void;
    updateUserContext: (updatedUser: Partial<User>) => void; // Added for profile updates
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface AuthProviderProps { children: ReactNode; }
const AUTH_TOKEN_KEY = 'authToken';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY)); // Initialize from storage
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserProfile = useCallback(async (currentToken: string) => {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        try {
            const profile = await fetchProfile();
            setUser({ id: profile.id, email: profile.email, name: profile.name }); // Map to User type
            setError(null);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            setToken(null); setUser(null); localStorage.removeItem(AUTH_TOKEN_KEY);
            delete apiClient.defaults.headers.common['Authorization'];
        }
    }, []);

    useEffect(() => {
        if (token) {
            loadUserProfile(token).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [token, loadUserProfile]); // Depend on token

    const login = async (credentials: LoginDto) => {
        setError(null); setIsLoading(true);
        try {
            const { accessToken, user: loggedInUser }: AuthResponse = await loginUser(credentials);
            localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            // IMPORTANT: Update token state *before* user state if useEffect depends on token
            setToken(accessToken);
            setUser(loggedInUser);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Login failed.';
            setError(message); throw new Error(message);
        } finally { setIsLoading(false); }
    };

    const register = async (details: RegisterDto): Promise<{user: UserProfile} | void> => {
        setError(null); setIsLoading(true);
        try {
            const result = await registerUser(details);
            setError(null);
            return result; // Return user profile if needed by component
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Registration failed.';
            setError(message); throw new Error(message);
        } finally { setIsLoading(false); }
    };

    const logout = () => {
        setError(null); setUser(null); setToken(null);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        delete apiClient.defaults.headers.common['Authorization'];
    };

    const clearError = () => setError(null);

    // Function to update user state (e.g., after profile edit)
    const updateUserContext = (updatedUser: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);
    };


    const contextValue: AuthContextType = {
        isAuthenticated: !!token && !!user,
        user, token, isLoading, login, logout, register, error, clearError, updateUserContext
    };

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};