// src/services/api.ts
import axios from 'axios'; // Removed AxiosError as it wasn't used directly here

// --- Base API Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor to add JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Optional: Response Interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized! Logging out or redirecting...");
            localStorage.removeItem('authToken');
            // Consider using a more robust way to handle redirect (e.g., via AuthContext or router history)
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- Define and Export Base Types ---
export interface UserProfileDto {
    id: number;
    name: string | null;
    email: string;
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
export interface TeamMembershipInfo { role: TeamRole; joinedAt: string; user: TeamMemberUser; }
export interface Team {
    id: number; name: string; ownerId: number; createdAt: string; updatedAt: string;
    owner: TeamOwner;
    members?: TeamMembershipInfo[];
    skills?: BaseSkillDto[];
}
export interface UserTeamListItem extends Omit<Team, 'members' | 'skills'> {
    owner: TeamOwner;
    currentUserRole: TeamRole;
}
export interface CreateTeamDto { name: string; }
export interface UpdateTeamDto { name?: string; }
export interface AddMemberDto { email: string; role?: TeamRole; }
export interface TeamMembership { userId: number; teamId: number; role: TeamRole; joinedAt: string; }

// --- Dashboard DTOs ---
export interface MemberSkillScoreItemDto { currentScore: number | null; }
export interface MemberSkillScoreDto { memberId: number; scores: { [skillId: number]: MemberSkillScoreItemDto }; }
export interface TeamDashboardSkillDto extends BaseSkillDto {}
export interface TeamDashboardMemberDto extends UserProfileDto { role: TeamRole; } // Added role
export interface TeamDashboardDto {
    teamId: number;
    teamName: string;
    owner: UserProfileDto;
    members: TeamDashboardMemberDto[]; // Uses member DTO with role
    teamSkills: TeamDashboardSkillDto[];
    memberScores: MemberSkillScoreDto[];
}

// --- History DTOs ---
export interface MemberSkillHistoryPointScoresDto { [skillId: number]: number | null; }
export interface MemberSkillHistoryPointDto { timestamp: number; dateLabel: string; scores: MemberSkillHistoryPointScoresDto; }
export interface MemberSkillHistoryDto { memberId: number; skillIds: number[]; history: MemberSkillHistoryPointDto[]; }

// --- Full SkillData (for SkillCard/SkillList) ---
export interface ProgressLogData { id: number; timestamp: string; score: number; notes?: string | null; timeSpentMinutes?: number | null; user?: Pick<UserProfileDto, 'id'|'name'|'email'> | null; }
export interface SkillData extends BaseSkillDto {
    description?: string | null; currentScore: number; ratingScaleType: string; updatedAt: string;
    category?: { id: number; name: string } | null;
    tags?: { tag: { id: number; name: string } }[];
    progressLogs?: ProgressLogData[];
    user?: Pick<UserProfileDto, 'id'|'name'> | null;
    team?: Pick<Team, 'id'|'name'> | null;
}

// === API Service Functions ===

// --- Authentication ---
export interface AuthResponse { accessToken: string; user: UserProfileDto; } // Ensure this is exported
export interface RegisterDto { email: string; password: string; name?: string; }
export interface UserProfileDto { id: number; name: string | null; email: string; }
export interface LoginDto { email: string; password: string; }

export const loginUser = async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
};

// --- UPDATE registerUser function signature and return type ---
export const registerUser = async (details: RegisterDto): Promise<AuthResponse> => { // <-- Change return type here
    // Backend now returns { accessToken: '...', user: {...} } on successful registration
    const response = await apiClient.post<AuthResponse>('/auth/register', details); // <-- Expect AuthResponse
    return response.data; // Return the full response data
};
// --- END UPDATE ---

export const fetchProfile = async (): Promise<UserProfileDto> => {
    const response = await apiClient.get<UserProfileDto>('/auth/profile');
    return response.data;
};

// --- Skills ---
export interface CreateSkillDto { name: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; notes?: string; userId?: number | null; teamId?: number | null; }
export interface UpdateSkillDto { name?: string; description?: string; categoryId?: number | null; currentScore?: number; maxScore?: number; ratingScaleType?: string; tags?: string[]; }

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
export const fetchTeamDetails = async (teamId: number): Promise<Team> => { const response = await apiClient.get<Team>(`/teams/${teamId}`); return response.data; };
export const createTeam = async (data: CreateTeamDto): Promise<Team> => { const response = await apiClient.post<Team>('/teams', data); return response.data; };
export const updateTeam = async (teamId: number, data: UpdateTeamDto): Promise<Team> => { const response = await apiClient.patch<Team>(`/teams/${teamId}`, data); return response.data; };
export const deleteTeam = async (teamId: number): Promise<void> => { await apiClient.delete(`/teams/${teamId}`); };

// --- Member Management ---
export const getTeamMembers = async (teamId: number): Promise<TeamMembershipInfo[]> => { const response = await apiClient.get<TeamMembershipInfo[]>(`/teams/${teamId}/members`); return response.data; };
export const addTeamMember = async (teamId: number, data: AddMemberDto): Promise<TeamMembership> => { const response = await apiClient.post<TeamMembership>(`/teams/${teamId}/members`, data); return response.data; };
export const removeTeamMember = async (teamId: number, memberIdToRemove: number): Promise<void> => { await apiClient.delete(`/teams/${teamId}/members/${memberIdToRemove}`); };

// --- Dashboard & History API Calls ---
export const fetchTeamDashboardDataAPI = async (teamId: number): Promise<TeamDashboardDto> => {
    // Use the real endpoint
    const response = await apiClient.get<TeamDashboardDto>(`/teams/${teamId}/dashboard`);
    return response.data;
    // Remove simulation logic
};
export const fetchMemberSkillHistoryAPI = async (teamId: number, memberId: number): Promise<MemberSkillHistoryDto> => {
    // Use the real endpoint
     const response = await apiClient.get<MemberSkillHistoryDto>(`/teams/${teamId}/members/${memberId}/history`);
     return response.data;
     // Remove simulation logic
};

export default apiClient;