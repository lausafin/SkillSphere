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
export interface UpdateCategoryDto { name: string; }
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

// NEW: Update Category
export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/categories/${id}`, data);
    return response.data;
};

// NEW: Delete Category
export const deleteCategory = async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
};

// --- Tags API ---
export const fetchTags = async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags'); // Ensure backend endpoint exists
    return response.data;
};


// --- Team API Types ---
// Match backend Prisma Models / DTOs as closely as possible
interface TeamOwner { id: number; name?: string | null; email: string; }
interface TeamMemberUser { id: number; name?: string | null; email: string; }
interface TeamMembershipInfo { role: string; joinedAt: string; user: TeamMemberUser; } // From TeamMembership include
export interface Team { // Export if used elsewhere
    id: number;
    name: string;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
    owner: TeamOwner; // Included from backend query
    // Optional includes based on backend findOne
    members?: TeamMembershipInfo[];
    // skills?: Partial<SkillData>[]; // Maybe just count or basic list
}
// Type for the list fetched by findUserTeams (might be slightly different than full findOne)
export interface UserTeamListItem extends Omit<Team, 'members' | 'skills'> { // Example: List doesn't include members/skills
    // Add user's role in this team if provided by backend endpoint
    currentUserRole?: string;
}
interface CreateTeamDto { name: string; }
interface UpdateTeamDto { name?: string; }


// --- Team API Functions ---

// Fetches teams the current user is a member of
export const fetchUserTeams = async (): Promise<UserTeamListItem[]> => {
    const response = await apiClient.get<UserTeamListItem[]>('/teams'); // Assuming GET /api/teams returns list for current user
    return response.data;
};

// Fetches details for a specific team (if user is member)
export const fetchTeamDetails = async (teamId: number): Promise<Team> => {
    const response = await apiClient.get<Team>(`/teams/${teamId}`);
    return response.data;
};

// Creates a new team
export const createTeam = async (data: CreateTeamDto): Promise<Team> => {
    const response = await apiClient.post<Team>('/teams', data);
    return response.data;
};

// Updates a team (e.g., rename) - Requires ownership
export const updateTeam = async (teamId: number, data: UpdateTeamDto): Promise<Team> => {
    const response = await apiClient.patch<Team>(`/teams/${teamId}`, data);
    return response.data;
};

// Deletes a team - Requires ownership
export const deleteTeam = async (teamId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`);
};


// --- Member Management API Functions (Placeholders - Add Later) ---
// export const addTeamMember = async (teamId, /* ... */) => { ... };
// export const removeTeamMember = async (teamId, userId) => { ... };
// export const getTeamMembers = async (teamId) => { ... };

// --- Skill API DTOs Need Update ---
// Ensure Create/Update Skill DTOs have optional userId and teamId
export interface CreateSkillDto {
    // ... other fields
    userId?: number | null; // Belongs to user
    teamId?: number | null; // Belongs to team
    notes?: string;
}
export interface UpdateSkillDto {
     // ... other fields
     // Usually ownership doesn't change on update, but structure needed
    userId?: number | null;
    teamId?: number | null;
}

// --- Update Skill API function signatures if needed ---
// export const fetchSkills = async (): Promise<SkillData[]> => { ... } // Needs backend update to return mixed skills
// export const createSkill = async (skillData: CreateSkillDto): Promise<SkillData> => { ... } // Needs to send userId OR teamId
// export const updateSkill = async (id: number, skillData: UpdateSkillDto): Promise<SkillData> => { ... }

export default apiClient; // Export instance for potential direct use
