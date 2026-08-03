import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  MessageResponse,
  Post,
  Profile,
  StyleSample,
  TokenResponse,
  User,
  Week,
  WeekSummary,
  XPost,
} from "../types";

const BASE_URL = "/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const TOKEN_KEY = "pw_access_token";
const REFRESH_KEY = "pw_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ---------------------------------------------------------------------------
// Request interceptor — attach access token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers["Authorization"] = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<TokenResponse>(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        tokenStorage.set(data.access_token, data.refresh_token);
        refreshQueue.forEach((cb) => cb(data.access_token));
        refreshQueue = [];
        original.headers["Authorization"] = `Bearer ${data.access_token}`;
        return apiClient(original);
      } catch {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post<MessageResponse>("/auth/register", { email, password }),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>("/auth/login", { email, password }),

  me: () => apiClient.get<User>("/auth/me"),

  verifyEmail: (token: string) =>
    apiClient.get<MessageResponse>(`/auth/verify-email?token=${token}`),

  resendVerification: (email: string) =>
    apiClient.post<MessageResponse>("/auth/resend-verification", { email }),

  forgotPassword: (email: string) =>
    apiClient.post<MessageResponse>("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<MessageResponse>("/auth/reset-password", {
      token,
      new_password: newPassword,
    }),
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileApi = {
  get: () => apiClient.get<Profile>("/profile"),
  update: (data: Partial<Profile>) => apiClient.put<Profile>("/profile", data),
};

// ---------------------------------------------------------------------------
// Style samples
// ---------------------------------------------------------------------------

export const samplesApi = {
  list: () => apiClient.get<StyleSample[]>("/style-samples"),
  add: (content: string) => apiClient.post<StyleSample>("/style-samples", { content }),
  delete: (id: string) => apiClient.delete(`/style-samples/${id}`),
};

// ---------------------------------------------------------------------------
// Weeks
// ---------------------------------------------------------------------------

export const weeksApi = {
  list: () => apiClient.get<WeekSummary[]>("/weeks"),
  generate: () => apiClient.post<Week>("/weeks/generate"),
  latest: () => apiClient.get<Week>("/weeks/latest"),
  get: (id: string) => apiClient.get<Week>(`/weeks/${id}`),
};

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export const videoApi = {
  getProfile: () => apiClient.get("/video/profile"),
  updateProfile: (data: Record<string, string | null>) =>
    apiClient.put("/video/profile", data),
  generateIdeas: () => apiClient.post("/video/ideas/generate"),
  latestIdeas: () => apiClient.get("/video/ideas/latest"),
  listBatches: () => apiClient.get("/video/ideas/batches"),
  getBatch: (batchId: string) => apiClient.get(`/video/ideas/batch/${batchId}`),
  deleteBatch: (batchId: string) => apiClient.delete(`/video/ideas/batch/${batchId}`),
  dismissIdea: (id: string) => apiClient.patch(`/video/ideas/${id}/dismiss`),
};

// ---------------------------------------------------------------------------
// X Threads (native generation)
// ---------------------------------------------------------------------------

export const xThreadsApi = {
  getProfile: () => apiClient.get("/x-threads/profile"),
  updateProfile: (data: Record<string, string | null>) =>
    apiClient.put("/x-threads/profile", data),
  generate: () => apiClient.post("/x-threads/generate"),
  latest: () => apiClient.get("/x-threads/latest"),
  listBatches: () => apiClient.get("/x-threads/batches"),
  getBatch: (batchId: string) => apiClient.get(`/x-threads/batch/${batchId}`),
  deleteBatch: (batchId: string) => apiClient.delete(`/x-threads/batch/${batchId}`),
  edit: (id: string, tweets: string[]) => apiClient.patch(`/x-threads/${id}`, { tweets }),
  copy: (id: string) => apiClient.post(`/x-threads/${id}/copy`),
};

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const postsApi = {
  edit: (id: string, editedBody: string) =>
    apiClient.patch<Post>(`/posts/${id}`, { edited_body: editedBody }),

  regenerate: (id: string, steeringNote?: string) =>
    apiClient.post<Post>(`/posts/${id}/regenerate`, { steering_note: steeringNote ?? null }),

  repurpose: (id: string) =>
    apiClient.post<XPost>(`/posts/${id}/repurpose`),

  reRepurpose: (id: string) =>
    apiClient.post<XPost>(`/posts/${id}/re-repurpose`),

  markCopied: (id: string) => apiClient.post<Post>(`/posts/${id}/copy`),
};
