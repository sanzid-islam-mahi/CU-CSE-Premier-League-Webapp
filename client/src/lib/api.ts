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
  },
};
