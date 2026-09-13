import {
  SourceContent,
  TransformationConfig,
  OutputType,
  ProjectItem,
} from '../types';
import { getStoredToken } from '../context/AuthContext';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    window.dispatchEvent(new Event('contentiq:unauthorized'));
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface JobStatusResponse {
  job: { id: string; projectId: string; status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; stage?: string; progress: number; error?: string };
}

export const ContentIQApiClient = {
  // ---- Auth ----
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  },
  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async getMe(): Promise<{ user: AuthResponse['user'] & { preferences: Record<string, string> } }> {
    return request('/auth/me');
  },
  async updateMe(patch: { name?: string; preferences?: Record<string, string> }) {
    return request('/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });
  },

  // ---- Transformations (text / youtube — no file bytes) ----
  async generateFromText(rawText: string, name: string, config: Partial<TransformationConfig>, outputs: OutputType[]) {
    return request<{ projectId: string; jobId: string }>('/transformations/generate', {
      method: 'POST',
      body: JSON.stringify({ source: { type: 'text', name, rawText }, config, outputs }),
    });
  },
  async generateFromYoutube(url: string, config: Partial<TransformationConfig>, outputs: OutputType[]) {
    return request<{ projectId: string; jobId: string }>('/transformations/generate', {
      method: 'POST',
      body: JSON.stringify({ source: { type: 'youtube', name: url, url }, config, outputs }),
    });
  },

  // ---- Sources (real file upload: pdf/docx/txt/video/audio) ----
  async uploadSource(file: File, config: Partial<TransformationConfig>, outputs: OutputType[]) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));
    formData.append('outputs', JSON.stringify(outputs));
    return request<{ projectId: string; jobId: string }>('/sources/upload', { method: 'POST', body: formData });
  },

  // ---- Jobs ----
  async getJob(jobId: string): Promise<JobStatusResponse> {
    return request(`/jobs/${jobId}`);
  },

  // ---- Projects ----
  async getProjects(): Promise<{ projects: ProjectItem[] }> {
    return request('/transformations/projects');
  },
  async getProject(id: string): Promise<{ project: ProjectItem }> {
    return request(`/transformations/projects/${id}`);
  },
  async deleteProject(id: string) {
    return request(`/transformations/projects/${id}`, { method: 'DELETE' });
  },

  // ---- Q&A / RAG ----
  async askQuestion(query: string, projectId: string) {
    return request<{ result: { answer: string; grounded: boolean; citation: string; sources: any[]; conversationId: string } }>('/qa/ask', {
      method: 'POST',
      body: JSON.stringify({ query, projectId }),
    });
  },
  async getConversation(projectId: string) {
    return request<{ messages: any[] }>(`/qa/${projectId}/conversation`);
  },

  // ---- Verification ----
  async runVerification(projectId: string, outputId?: string) {
    return request<{ report: any }>('/verification/audit', { method: 'POST', body: JSON.stringify({ projectId, outputId }) });
  },
  async getLatestVerification(projectId: string) {
    return request<{ report: any | null }>(`/verification/${projectId}/latest`);
  },

  // ---- YouTube quick preview (no auth, not persisted) ----
  async analyzeYoutube(url: string) {
    return request<{ data: any }>('/youtube/analyze', { method: 'POST', body: JSON.stringify({ url }) });
  },

  // ---- Analytics ----
  async getGlobalTelemetry() {
    return request<{ metrics: any; topOutputTypes: any[]; languageDistribution: any[] }>('/analytics/telemetry');
  },
  async getMyAnalytics() {
    return request<{ metrics: any }>('/analytics/summary');
  },

  // ---- History ----
  async getHistory() {
    return request<{ logs: any[] }>('/history');
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
  async getHealthInfo(): Promise<{ aiModel: string; embeddingModel: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },
};
