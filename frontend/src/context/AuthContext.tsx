// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { AxiosError } from 'axios'; // Import AxiosError for type checking
// Assuming your API service exists and has auth functions
import apiClient, { fetchProfile, loginUser, registerUser } from '../services/api'; // Adjust import path

// Define the shape of the user object
interface User { id: number; email: string; name?: string | null; }

// Define DTOs inline or import from a shared types location
interface LoginDto { email: string; password: string; }
interface RegisterDto { email: string; password: string; name?: string; }


// Define the shape of the context value
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: LoginDto) => Promise<void>;
    logout: () => void;
    register: (details: RegisterDto) => Promise<void>;
    error: string | null; // Error message state
    clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }
const AUTH_TOKEN_KEY = 'authToken';

// Helper function to extract error message from AxiosError
const getApiErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        // Check if backend sent a structured error message
        const responseData = error.response?.data;
        if (responseData && typeof responseData === 'object' && 'message' in responseData) {
            // Handle potential array messages from class-validator
            if (Array.isArray(responseData.message)) {
                return responseData.message.join(', ');
            }
            return String(responseData.message); // Use message from backend response
        }
        // Fallback based on status code if no specific message
        switch (error.response?.status) {
            case 400: return 'Invalid data submitted. Please check the form.'; // Bad Request
            case 401: return 'Incorrect email or password.'; // Unauthorized
            case 403: return 'You do not have permission to perform this action.'; // Forbidden
            case 404: return 'Could not find the requested resource.'; // Not Found
            case 409: return 'Conflict: This email may already be registered.'; // Conflict
            case 500: return 'A server error occurred. Please try again later.'; // Internal Server Error
            default: break; // Handle other cases below
        }
        // Generic network error if no response or specific status code mapping
        if (error.message.includes('Network Error')) {
             return 'Network Error: Unable to connect to the server. Please check your connection or try again later.';
        }
        // Other Axios errors
         return error.message || 'An unknown error occurred.';
    }
    // Non-Axios errors
    return String(error) || 'An unknown error occurred.';
};


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserProfile = useCallback(async (currentToken: string) => { /* ... no changes needed here ... */
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        try { const profile = await fetchProfile(); setUser(profile); setError(null); }
        catch (err) { console.error("Profile Fetch Err:", err); setToken(null); setUser(null); localStorage.removeItem(AUTH_TOKEN_KEY); delete apiClient.defaults.headers.common['Authorization']; }
    }, []);

    useEffect(() => { /* ... no changes needed here ... */
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) { setToken(storedToken); loadUserProfile(storedToken).finally(() => setIsLoading(false)); }
        else { setIsLoading(false); }
    }, [loadUserProfile]);

    const login = async (credentials: LoginDto) => {
        setError(null); setIsLoading(true);
        try {
            const { accessToken, user: loggedInUser } = await loginUser(credentials);
            localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
            setToken(accessToken);
            setUser(loggedInUser);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (err: unknown) { // Catch unknown type
            console.error("Login context error:", err);
            const message = getApiErrorMessage(err); // Use helper function
            setError(message);
            throw new Error(message); // Re-throw for component handling if needed
        } finally {
             setIsLoading(false);
        }
    };

    const register = async (details: RegisterDto) => {
        setError(null); setIsLoading(true);
        try {
            // Assuming registerUser API call now potentially throws specific errors handled by getApiErrorMessage
            await registerUser(details);
            // Registration successful: Clear error (implicitly done above)
            // Let the component handle showing success (e.g., RegisterPage shows the success message)
        } catch (err: unknown) { // Catch unknown type
            console.error("Register context error:", err);
            const message = getApiErrorMessage(err); // Use helper function
            setError(message);
             throw new Error(message); // Re-throw for component handling
        } finally {
             setIsLoading(false);
        }
    };

    const logout = () => { /* ... no changes needed here ... */
        setError(null); setUser(null); setToken(null); localStorage.removeItem(AUTH_TOKEN_KEY); delete apiClient.defaults.headers.common['Authorization'];
    };

     const clearError = () => { setError(null); };

    const contextValue: AuthContextType = {
        isAuthenticated: !!token && !!user,
        user, token, isLoading, login, logout, register, error, clearError,
    };

    return ( <AuthContext.Provider value={contextValue}> {children} </AuthContext.Provider> );
};

export const useAuth = (): AuthContextType => { /* ... no changes needed here ... */
    const context = useContext(AuthContext);
    if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
    return context;
};