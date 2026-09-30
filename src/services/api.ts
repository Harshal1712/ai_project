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

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    // fetch only rejects on network/CORS failures, which otherwise surface as a vague generic error.
    throw new ApiError(0, `Can't reach the server at ${API_BASE_URL}. Make sure the backend is running and you opened the app at the URL set as FRONTEND_URL in server/.env.`);
  }

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

// ---- Streaming (Server-Sent Events over POST) ----

export interface ChatCitation {
  projectId?: string;
  sourceId: string;
  sourceName?: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
  text: string;
  score: number;
}

export interface StoredChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations: ChatCitation[];
  createdAt?: string;
}

export interface AnswerStreamHandlers {
  onSources?: (sources: ChatCitation[]) => void;
  onToken?: (text: string) => void;
  onDone?: (result: { answer: string; grounded: boolean }) => void;
}

// EventSource only supports GET, so the stream is read from a fetch body.
// Errors before the stream opens (400/403/404/429) arrive as normal JSON;
// failures mid-stream arrive as an `error` event.
async function streamRequest(path: string, body: unknown, handlers: AnswerStreamHandlers, signal?: AbortSignal): Promise<void> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 401) window.dispatchEvent(new Event('contentiq:unauthorized'));
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.error || `Request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (rawEvent: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of rawEvent.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      // lines starting with ':' are heartbeat comments
    }
    if (dataLines.length === 0) return;
    const data = JSON.parse(dataLines.join('\n'));
    if (event === 'sources') handlers.onSources?.(data.sources);
    else if (event === 'token') handlers.onToken?.(data.text);
    else if (event === 'done') handlers.onDone?.({ answer: data.answer, grounded: data.grounded });
    else if (event === 'error') throw new ApiError(500, data.error || 'The answer stream failed.');
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      dispatch(rawEvent);
    }
  }
  if (buffer.trim()) dispatch(buffer);
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  language: string;
  projects: { id: string; name: string; sourceType: string; sourceName: string }[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: StoredChatMessage[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  citation?: string;
  box: number;
  dueAt: string;
  reviewCount: number;
  correctCount: number;
}

export interface DeckStats {
  total: number;
  due: number;
  new: number;
  mastered: number;
}

export interface FlashcardDeckData {
  id: string;
  language: string;
  updatedAt: string;
  stats: DeckStats;
  cards: Flashcard[];
}

export interface StudyOverviewItem {
  id: string;
  name: string;
  sourceType: string;
  sourceName: string;
  flashcards: DeckStats;
  quiz: { attempts: number; bestPercent: number | null; lastPercent: number | null };
}

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string; avatarUrl?: string; hasPassword?: boolean; googleLinked?: boolean };
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
  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
  },
  async forgotPassword(email: string): Promise<{ message: string }> {
    return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
  },
  async changePassword(currentPassword: string | undefined, newPassword: string): Promise<{ user: AuthResponse['user'] }> {
    return request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
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
  async clearConversation(projectId: string) {
    return request(`/qa/${projectId}/conversation`, { method: 'DELETE' });
  },
  async askQuestionStream(query: string, projectId: string, language: string, handlers: AnswerStreamHandlers, signal?: AbortSignal) {
    return streamRequest('/qa/ask/stream', { query, projectId, language }, handlers, signal);
  },

  // ---- Multi-document chat ----
  async getChatSessions() {
    return request<{ sessions: ChatSessionSummary[] }>('/chat/sessions');
  },
  async createChatSession(projectIds: string[], title?: string, language?: string) {
    return request<{ session: ChatSessionSummary }>('/chat/sessions', { method: 'POST', body: JSON.stringify({ projectIds, title, language }) });
  },
  async getChatSession(id: string) {
    return request<{ session: ChatSessionSummary }>(`/chat/sessions/${id}`);
  },
  async updateChatSession(id: string, patch: { title?: string; projectIds?: string[]; language?: string }) {
    return request<{ session: ChatSessionSummary }>(`/chat/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  async deleteChatSession(id: string) {
    return request(`/chat/sessions/${id}`, { method: 'DELETE' });
  },
  async askChatSessionStream(sessionId: string, query: string, language: string, handlers: AnswerStreamHandlers, signal?: AbortSignal) {
    return streamRequest(`/chat/sessions/${sessionId}/ask/stream`, { query, language }, handlers, signal);
  },

  // ---- Translation ----
  async getLanguages() {
    return request<{ languages: string[] }>('/transformations/languages');
  },
  async translateOutput(outputId: string, language: string) {
    return request<{ output: any }>(`/transformations/outputs/${outputId}/translate`, { method: 'POST', body: JSON.stringify({ language }) });
  },

  // ---- Study mode ----
  async getStudyOverview() {
    return request<{ projects: StudyOverviewItem[] }>('/study/overview');
  },
  async getStudyProject(projectId: string) {
    return request<{
      project: { id: string; name: string; sourceName: string; language?: string };
      deck: FlashcardDeckData | null;
      quizAttempts: { id: string; score: number; total: number; createdAt: string }[];
    }>(`/study/${projectId}`);
  },
  async generateFlashcards(projectId: string, count: number, language?: string) {
    return request<{ deck: FlashcardDeckData; added: number }>(`/study/${projectId}/flashcards`, { method: 'POST', body: JSON.stringify({ count, language }) });
  },
  async reviewFlashcard(projectId: string, cardId: string, grade: 'again' | 'good' | 'easy') {
    return request<{ card: Partial<Flashcard> & { id: string }; stats: DeckStats }>(`/study/${projectId}/flashcards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade }),
    });
  },
  async deleteFlashcard(projectId: string, cardId: string) {
    return request<{ stats: DeckStats }>(`/study/${projectId}/flashcards/${cardId}`, { method: 'DELETE' });
  },
  async resetFlashcards(projectId: string) {
    return request<{ deck: FlashcardDeckData }>(`/study/${projectId}/flashcards/reset`, { method: 'POST' });
  },
  async recordQuizAttempt(projectId: string, score: number, total: number, outputId?: string) {
    return request(`/study/${projectId}/quiz-attempts`, { method: 'POST', body: JSON.stringify({ score, total, outputId }) });
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
