// src/services/api.ts
import axios from 'axios';
import { SkillData } from '../components/SkillCard'; // Adjust path if needed

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

// --- Interceptors ---
apiClient.interceptors.request.use( (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error) );

apiClient.interceptors.response.use( (response) => response, (error) => {
    if (error.response?.status === 401) {
        console.error("Unauthorized! Token may be invalid or expired.");
        localStorage.removeItem('authToken');
        // Optionally trigger a logout state change or redirect
        // window.location.href = '/login'; // Avoid direct manipulation if using React Router
    }
    return Promise.reject(error);
});

// --- DTOs & Types (Ideally share with backend or define robustly) ---
export interface LoginDto { email: string; password: string; }
export interface RegisterDto { email: string; password: string; name?: string; }
export interface AuthResponse { accessToken: string; user: { id: number; email: string; name?: string | null; }; }
export interface UserProfile { id: number; email: string; name?: string | null; createdAt: string; }
export interface CreateSkillDto { name: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }
export interface UpdateSkillDto { name?: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }
export interface CreateProgressLogDto { score: number; notes?: string; timeSpentMinutes?: number; timestamp?: Date; }
export interface ProgressLogData { id: number; timestamp: string; score: number; notes?: string | null; timeSpentMinutes?: number | null; /* evidence?: any[]; */ }
export interface Category { id: number; name: string; }
export interface CreateCategoryDto { name: string; }
export interface Tag { id: number; name: string; }

// --- Authentication API ---
export const loginUser = async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
};
export const registerUser = async (details: RegisterDto): Promise<{ user: UserProfile }> => {
    const response = await apiClient.post<{ user: UserProfile }>('/auth/register', details);
    return response.data;
};
export const fetchProfile = async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/auth/profile');
    return response.data;
};
// Add updateUserProfile if implementing profile editing fully
// export const updateUserProfile = async (userId: number, data: {name?: string}): Promise<UserProfile> => { ... }

// --- Skills API ---
export const fetchSkills = async (): Promise<SkillData[]> => {
    const response = await apiClient.get<SkillData[]>('/skills');
    return response.data;
};
export const fetchSkillById = async (id: number): Promise<SkillData> => {
     const response = await apiClient.get<SkillData>(`/skills/${id}`);
     return response.data;
};
export const createSkill = async (skillData: CreateSkillDto): Promise<SkillData> => {
    const response = await apiClient.post<SkillData>('/skills', skillData);
    return response.data;
};
export const updateSkill = async (id: number, skillData: UpdateSkillDto): Promise<SkillData> => {
    const response = await apiClient.patch<SkillData>(`/skills/${id}`, skillData);
    return response.data;
};
export const deleteSkill = async (id: number): Promise<void> => {
    await apiClient.delete(`/skills/${id}`);
};

// --- Progress Logs API ---
export const fetchProgressLogs = async (skillId: number): Promise<ProgressLogData[]> => {
    const response = await apiClient.get<ProgressLogData[]>(`/skills/${skillId}/logs`);
    return response.data;
};
export const createProgressLog = async (skillId: number, logData: CreateProgressLogDto): Promise<ProgressLogData> => {
    const response = await apiClient.post<ProgressLogData>(`/skills/${skillId}/logs`, logData);
    return response.data;
};

// --- Categories API ---
export const fetchCategories = async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
};
export const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
};
// Add update/delete category functions if needed

// --- Tags API ---
export const fetchTags = async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags'); // Ensure backend endpoint exists
    return response.data;
};

export default apiClient; // Export instance for potential direct use