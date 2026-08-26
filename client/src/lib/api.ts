const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("csepl_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface BatchItem {
  id: number;
  name: string;
  session: string;
  batchNumber: number;
  slug: string;
  slogan?: string;
  avatarUrl?: string;
  studentsCount: number;
  teamsCount: number;
  createdAt: string;
}

export interface UserItem {
  id: number;
  studentId: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isTemporaryPassword: boolean;
  temporaryPlainPassword?: string | null;
  batch: string;
  batchId?: number | null;
  cricketRole?: string;
  footballPosition?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface TournamentItem {
  id: number;
  name: string;
  slug: string;
  sport: "CRICKET" | "FOOTBALL";
  season: string;
  status: string;
  rules?: any;
  teamsCount: number;
  matchesCount: number;
  organizers: { id: number; name: string; roll: string; email: string }[];
  createdAt: string;
}

export const api = {
  auth: {
    adminLogin: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.token) {
        localStorage.setItem("csepl_token", data.token);
        localStorage.setItem("csepl_user", JSON.stringify(data.user));
      }
      return data;
    },

    playerLogin: async (identifier: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.token) {
        localStorage.setItem("csepl_token", data.token);
        localStorage.setItem("csepl_user", JSON.stringify(data.user));
      }
      return data;
    },

    logout: () => {
      localStorage.removeItem("csepl_token");
      localStorage.removeItem("csepl_user");
    },

    getCurrentUser: () => {
      const userStr = localStorage.getItem("csepl_user");
      return userStr ? JSON.parse(userStr) : null;
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user");
      return data;
    },

    updateProfile: async (profileData: {
      name?: string;
      email?: string;
      phone?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      cricketRole?: string | null;
      battingStyle?: string | null;
      bowlingStyle?: string | null;
      footballPosition?: string | null;
      preferredJerseyNo?: number | null;
    }) => {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      if (data.user) {
        localStorage.setItem("csepl_user", JSON.stringify(data.user));
      }
      return data;
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      // Update local storage user flag if present
      const currentUser = api.auth.getCurrentUser();
      if (currentUser) {
        currentUser.isTemporaryPassword = false;
        localStorage.setItem("csepl_user", JSON.stringify(currentUser));
      }
      return data;
    },
  },

  batches: {
    getAll: async (): Promise<BatchItem[]> => {
      const res = await fetch(`${API_BASE}/batches`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch batches");
      return data;
    },

    create: async (batch: { name: string; session: string; batchNumber: number; slogan?: string }): Promise<BatchItem> => {
      const res = await fetch(`${API_BASE}/batches`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(batch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create batch");
      return data;
    },

    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/batches/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete batch");
      return data;
    },
  },

  users: {
    getAll: async (params?: { search?: string; batchId?: number }): Promise<UserItem[]> => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.batchId) query.append("batchId", params.batchId.toString());
      const res = await fetch(`${API_BASE}/users?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      return data;
    },

    create: async (user: {
      studentId: string;
      name: string;
      email?: string;
      batchId?: number | null;
      cricketRole?: string;
      footballPosition?: string;
      temporaryPassword?: string;
    }) => {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      return data;
    },

    bulkImport: async (rows: { roll: string; name: string; email: string; batch?: string; role?: string }[]) => {
      const res = await fetch(`${API_BASE}/users/bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(rows),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk import users");
      return data;
    },

    resetTempPass: async (userId: number) => {
      const res = await fetch(`${API_BASE}/users/${userId}/reset-temp-pass`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      return data;
    },

    delete: async (userId: number) => {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      return data;
    },

    getPublicProfile: async (idOrRoll: string | number) => {
      const res = await fetch(`${API_BASE}/users/${idOrRoll}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch user profile");
      return data;
    },
  },

  tournaments: {
    getAll: async (): Promise<TournamentItem[]> => {
      const res = await fetch(`${API_BASE}/tournaments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch tournaments");
      return data;
    },

    create: async (tournament: {
      name: string;
      sport: "CRICKET" | "FOOTBALL";
      season: string;
      rules?: any;
    }): Promise<TournamentItem> => {
      const res = await fetch(`${API_BASE}/tournaments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(tournament),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create tournament");
      return data;
    },

    delete: async (tournamentId: number) => {
      const res = await fetch(`${API_BASE}/tournaments/${tournamentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete tournament");
      return data;
    },

    assignOrganizer: async (tournamentId: number, userId: number) => {
      const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/organizers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign organizer");
      return data;
    },

    removeOrganizer: async (tournamentId: number, userId: number) => {
      const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/organizers/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove organizer");
      return data;
    },

    getDetail: async (idOrSlug: string | number) => {
      const res = await fetch(`${API_BASE}/tournaments/${idOrSlug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch tournament detail");
      return data;
    },

    importBatch: async (idOrSlug: string | number, payload: {
      batchId: number;
      teamName?: string;
      shortName?: string;
      groupId?: number;
    }) => {
      const res = await fetch(`${API_BASE}/tournaments/${idOrSlug}/teams/import-batch`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import batch as team");
      return data;
    },

    createGroup: async (idOrSlug: string | number, name: string) => {
      const res = await fetch(`${API_BASE}/tournaments/${idOrSlug}/groups`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group");
      return data;
    },

    assignTeamsToGroup: async (idOrSlug: string | number, groupId: number, teamIds: number[]) => {
      const res = await fetch(`${API_BASE}/tournaments/${idOrSlug}/groups/${groupId}/teams`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ teamIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign teams to group");
      return data;
    },

    deleteGroup: async (idOrSlug: string | number, groupId: number) => {
      const res = await fetch(`${API_BASE}/tournaments/${idOrSlug}/groups/${groupId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete group");
      return data;
    },

    getStandings: async (idOrSlug: string | number) => {
      const res = await fetch(`${API_BASE}/tournaments/${idOrSlug}/standings`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compute standings");
      return data;
    },
  },

  teams: {
    get: async (id: number) => {
      const res = await fetch(`${API_BASE}/teams/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch team");
      return data;
    },

    create: async (payload: {
      tournamentId: number;
      name: string;
      shortName?: string;
      batchId?: number | null;
      groupId?: number | null;
      logoUrl?: string | null;
      captainId?: number | null;
    }) => {
      const res = await fetch(`${API_BASE}/teams`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");
      return data;
    },

    update: async (id: number, payload: {
      name?: string;
      shortName?: string;
      groupId?: number | null;
      logoUrl?: string | null;
      captainId?: number | null;
      viceCaptainId?: number | null;
    }) => {
      const res = await fetch(`${API_BASE}/teams/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update team");
      return data;
    },

    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/teams/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete team");
      return data;
    },

    addMember: async (teamId: number, payload: {
      userId: number;
      jerseyNumber?: number | null;
      isCaptain?: boolean;
      isViceCaptain?: boolean;
    }) => {
      const res = await fetch(`${API_BASE}/teams/${teamId}/members`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member to team");
      return data;
    },

    removeMember: async (teamId: number, userId: number) => {
      const res = await fetch(`${API_BASE}/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member from team");
      return data;
    },
  },

  matches: {
    get: async (id: number) => {
      const res = await fetch(`${API_BASE}/matches/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch match");
      return data;
    },

    schedule: async (tournamentIdOrSlug: string | number, payload: {
      teamAId: number;
      teamBId: number;
      groupId?: number | null;
      stage?: string;
      startTime?: string | null;
      venue?: string | null;
      matchNumber?: number;
    }) => {
      const res = await fetch(`${API_BASE}/matches/tournament/${tournamentIdOrSlug}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule match");
      return data;
    },

    generateRoundRobin: async (tournamentIdOrSlug: string | number) => {
      const res = await fetch(`${API_BASE}/matches/tournament/${tournamentIdOrSlug}/generate-round-robin`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate fixtures");
      return data;
    },

    generateKnockouts: async (tournamentIdOrSlug: string | number) => {
      const res = await fetch(`${API_BASE}/matches/tournament/${tournamentIdOrSlug}/generate-knockouts`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate knockout bracket");
      return data;
    },

    clearScheduled: async (tournamentIdOrSlug: string | number) => {
      const res = await fetch(`${API_BASE}/matches/tournament/${tournamentIdOrSlug}/matches/scheduled`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear scheduled matches");
      return data;
    },

    update: async (id: number, payload: any) => {
      const res = await fetch(`${API_BASE}/matches/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update match");
      return data;
    },

    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/matches/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete match");
      return data;
    },

    assignScorer: async (matchId: number, userId: number) => {
      const res = await fetch(`${API_BASE}/matches/${matchId}/scorers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign scorer");
      return data;
    },

    removeScorer: async (matchId: number, userId: number) => {
      const res = await fetch(`${API_BASE}/matches/${matchId}/scorers/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove scorer");
      return data;
    },
  },
};
