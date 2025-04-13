// src/services/api.ts
import axios from 'axios';
// Removed unused import of BackendTeamRole

// --- Base API Configuration ---
// Use environment variable provided by Vercel/local .env
// Ensure this INCLUDES /api if your backend uses a global prefix
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 20000, // Example: 20 second timeout (adjust as needed)
});

// Request Interceptor to add JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Your token storage key
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Optional: Response Interceptor for global error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized (401)! Potentially redirecting to login...");
            // Implement logout/redirect logic here, potentially using a global state or event emitter
            // For simplicity, just remove token here
            localStorage.removeItem('authToken');
            // Force reload might be too disruptive, better handled by routing/context
            // window.location.href = '/login';
        }
        // Return the error so components can potentially handle specific cases
        return Promise.reject(error);
    }
);

// --- Define and Export Base Types/DTOs ---
export interface UserProfileDto {
    id: number;
    name: string | null;
    email: string;
    // createdAt?: string;
}

export interface BaseSkillDto {
    id: number;
    name: string;
    maxScore: number;
}

// --- Define Frontend Enum matching Backend ---
export enum TeamRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER'
}

// --- Team API Types ---
export interface TeamOwner extends UserProfileDto {}
export interface TeamMemberUser extends UserProfileDto {}
export interface TeamMembershipInfo { role: TeamRole; joinedAt: string; user: TeamMemberUser; } // Used by getTeamMembers
export interface Team { // Type for fetchTeamDetails response
    id: number; name: string; ownerId: number; createdAt: string; updatedAt: string;
    owner: TeamOwner;
    members?: TeamMembershipInfo[]; // Included in detailed view
    skills?: BaseSkillDto[]; // Included in detailed view
    // Add currentUserRole if findOne endpoint provides it
    currentUserRole?: TeamRole;
}
// Type for fetchUserTeams response list items
export interface UserTeamListItem extends Omit<Team, 'members' | 'skills'> {
    owner: TeamOwner;
    currentUserRole: TeamRole; // Role of the logged-in user in this team
}
// DTOs for Team mutation payloads
export interface CreateTeamDto { name: string; }
export interface UpdateTeamDto { name?: string; }
// DTOs for Member Management payloads/responses
export interface AddMemberDto { email: string; role?: TeamRole; }
export interface TeamMembership { userId: number; teamId: number; role: TeamRole; joinedAt: string; }

// --- History DTOs (Defined BEFORE usage in SkillProgressSummaryDto) ---
export interface MemberSkillHistoryPointScoresDto { [skillId: string]: number | null; }
export interface SkillProgressHistoryPointScoresDto extends MemberSkillHistoryPointScoresDto {} // Alias if needed, or use MemberSkillHistoryPointScoresDto directly
export interface MemberSkillHistoryPointDto { timestamp: number; dateLabel: string; scores: MemberSkillHistoryPointScoresDto; }

// --- Dashboard DTOs ---
export interface MemberSkillScoreItemDto { currentScore: number | null; }
export interface MemberSkillScoreDto { memberId: number; scores: { [skillId: number]: MemberSkillScoreItemDto }; }
export interface TeamDashboardSkillDto extends BaseSkillDto {}
export interface TeamDashboardMemberDto extends UserProfileDto { role: TeamRole; }
export interface TeamDashboardDto {
    teamId: number;
    teamName: string;
    owner: UserProfileDto;
    members: TeamDashboardMemberDto[];
    teamSkills: TeamDashboardSkillDto[];
    memberScores: MemberSkillScoreDto[];
}

// --- History DTOs ---
export interface SkillProgressHistoryPointScoresDto { // Renamed for clarity below
    [skillId: string]: number | null;
}
// --- Ensure this interface is EXPORTED and named correctly ---
export interface SkillProgressHistoryPointDto { // Used by both history types below
    timestamp: number;
    dateLabel: string;
    scores: SkillProgressHistoryPointScoresDto; // Use the correct scores type name
}
// --- END Ensure ---

// DTO for Member-specific history endpoint response
export interface MemberSkillHistoryDto {
    memberId: number;
    skillIds: number[];
    history: SkillProgressHistoryPointDto[]; // Uses the common point DTO
}
// DTO for Personal Skill History endpoint response
export interface SkillProgressSummaryDto {
     skillNames: { [skillId: number]: string };
     history: SkillProgressHistoryPointDto[]; // Uses the common point DTO
}


// --- Full SkillData (for SkillCard/SkillList) ---
export interface ProgressLogData {
    id: number; timestamp: string; score: number; notes?: string | null; timeSpentMinutes?: number | null;
    user?: Pick<UserProfileDto, 'id'|'name'|'email'> | null; // User who logged
    // evidence?: any[];
}
export interface SkillData extends BaseSkillDto { // Extends base (id, name, maxScore)
    description?: string | null;
    // currentScore removed
    ratingScaleType: string;
    updatedAt: string; // Main record update timestamp
    category?: { id: number; name: string } | null;
    tags?: { tag: { id: number; name: string } }[];
    // progressLogs?: ProgressLogData[]; // Excluded from list view for performance
    user?: Pick<UserProfileDto, 'id'|'name'> | null; // Author if personal
    team?: Pick<Team, 'id'|'name'> | null; // Team if team skill
    // Latest score info (returned by backend findAll/findOne)
    latestScoreData?: {
        score: number | null;
        timestamp: string | null; // Use string for ISO date
        userId?: number | null;
    } | null;
}


// === API Service Functions ===

// --- Authentication ---
export interface AuthResponse { accessToken: string; user: UserProfileDto; }
export interface LoginDto { email: string; password: string; }
export interface RegisterDto { email: string; password: string; name?: string; }

export const loginUser = async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
};
export const registerUser = async (details: RegisterDto): Promise<AuthResponse> => {
    // Backend now returns AuthResponse on successful registration
    const response = await apiClient.post<AuthResponse>('/auth/register', details);
    return response.data;
};
export const fetchProfile = async (): Promise<UserProfileDto> => {
    const response = await apiClient.get<UserProfileDto>('/auth/profile');
    return response.data;
};

// --- Skills ---
export interface CreateSkillDto { // DTO for API call payload
    name: string; description?: string; categoryId?: number | null;
    maxScore?: number; ratingScaleType?: string; tags?: string[]; notes?: string;
    userId?: number | null; teamId?: number | null; // Ownership
    initialScore?: number; // Optional score for first log entry
}
export interface UpdateSkillDto { // DTO for API call payload
    name?: string; description?: string; categoryId?: number | null;
    maxScore?: number; ratingScaleType?: string; tags?: string[];
    // No currentScore
}

export const fetchSkills = async (): Promise<SkillData[]> => { const response = await apiClient.get<SkillData[]>('/skills'); return response.data; };
export const fetchSkillById = async (id: number): Promise<SkillData> => { const response = await apiClient.get<SkillData>(`/skills/${id}`); return response.data; };
export const createSkill = async (skillData: CreateSkillDto): Promise<SkillData> => { const response = await apiClient.post<SkillData>('/skills', skillData); return response.data; };
export const updateSkill = async (id: number, skillData: UpdateSkillDto): Promise<SkillData> => { const response = await apiClient.patch<SkillData>(`/skills/${id}`, skillData); return response.data; };
export const deleteSkill = async (id: number): Promise<void> => { await apiClient.delete(`/skills/${id}`); };

// --- Categories ---
export interface Category { id: number; name: string; }
export interface CreateCategoryDto { name: string; }
export interface UpdateCategoryDto { name?: string; }

export const fetchCategories = async (): Promise<Category[]> => { const response = await apiClient.get<Category[]>('/categories'); return response.data; };
export const createCategory = async (data: CreateCategoryDto): Promise<Category> => { const response = await apiClient.post<Category>('/categories', data); return response.data; };
export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<Category> => { const response = await apiClient.patch<Category>(`/categories/${id}`, data); return response.data; };
export const deleteCategory = async (id: number): Promise<void> => { await apiClient.delete(`/categories/${id}`); };

// --- Tags ---
export interface Tag { id: number; name: string; }
export const fetchTags = async (): Promise<Tag[]> => { const response = await apiClient.get<Tag[]>('/tags'); return response.data; };

// --- Progress Logs ---
export interface CreateProgressLogDto { score: number; notes?: string; timeSpentMinutes?: number; timestamp?: Date; }
export const fetchProgressLogs = async (skillId: number): Promise<ProgressLogData[]> => { const response = await apiClient.get<ProgressLogData[]>(`/skills/${skillId}/logs`); return response.data; };
export const createProgressLog = async (skillId: number, logData: CreateProgressLogDto): Promise<ProgressLogData> => { const response = await apiClient.post<ProgressLogData>(`/skills/${skillId}/logs`, logData); return response.data; };

// --- Teams ---
export const fetchUserTeams = async (): Promise<UserTeamListItem[]> => { const response = await apiClient.get<UserTeamListItem[]>('/teams'); return response.data; };
export const fetchTeamDetails = async (teamId: number): Promise<Team> => { const response = await apiClient.get<Team>(`/teams/${teamId}`); return response.data; }; // Assumes returns full details
export const createTeam = async (data: CreateTeamDto): Promise<Team> => { const response = await apiClient.post<Team>('/teams', data); return response.data; };
export const updateTeam = async (teamId: number, data: UpdateTeamDto): Promise<Team> => { const response = await apiClient.patch<Team>(`/teams/${teamId}`, data); return response.data; };
export const deleteTeam = async (teamId: number): Promise<void> => { await apiClient.delete(`/teams/${teamId}`); };

// --- Member Management ---
export const getTeamMembers = async (teamId: number): Promise<TeamMembershipInfo[]> => { const response = await apiClient.get<TeamMembershipInfo[]>(`/teams/${teamId}/members`); return response.data; };
export const addTeamMember = async (teamId: number, data: AddMemberDto): Promise<TeamMembership> => { const response = await apiClient.post<TeamMembership>(`/teams/${teamId}/members`, data); return response.data; };
export const removeTeamMember = async (teamId: number, memberIdToRemove: number): Promise<void> => { await apiClient.delete(`/teams/${teamId}/members/${memberIdToRemove}`); };

// --- Dashboard & History API Calls ---
export const fetchTeamDashboardDataAPI = async (teamId: number): Promise<TeamDashboardDto> => {
    const response = await apiClient.get<TeamDashboardDto>(`/teams/${teamId}/dashboard`);
    return response.data;
};
export const fetchMemberSkillHistoryAPI = async (teamId: number, memberId: number): Promise<MemberSkillHistoryDto> => {
     const response = await apiClient.get<MemberSkillHistoryDto>(`/teams/${teamId}/members/${memberId}/history`);
     return response.data;
};
// Fetch function for the personal progress summary chart on the main dashboard
export const fetchSkillProgressSummary = async (userId: string): Promise<SkillProgressSummaryDto> => {
    const response = await apiClient.get<SkillProgressSummaryDto>('/skills/progress-summary', {
        params: { userId } // userId is now guaranteed to be string
    });
    return response.data;
};


export default apiClient; // Export the configured instance if needed