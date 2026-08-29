import { getAccessToken, getRefreshToken, setAuthSession, clearAuthSession, AuthTokens } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If not FormData, default content-type to application/json
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  let response = await fetch(url, { ...options, headers });

  // Handle Token Expiry (401) with refresh token
  if (response.status === 401 && getRefreshToken()) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: getRefreshToken() }),
      });

      if (refreshRes.ok) {
        const authData: AuthTokens = await refreshRes.json();
        setAuthSession(authData);
        
        // Retry original request with new token
        headers.set('Authorization', `Bearer ${authData.access_token}`);
        response = await fetch(url, { ...options, headers });
      } else {
        clearAuthSession();
      }
    } catch {
      clearAuthSession();
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

// ----------------- Auth API -----------------
export const authApi = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    return apiFetch<AuthTokens>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (name: string, email: string, password: string, role = 'student'): Promise<AuthTokens> => {
    return apiFetch<AuthTokens>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthSession();
    }
  },

  getMe: async () => {
    return apiFetch('/api/auth/me');
  }
};

// ----------------- Chat API -----------------
export interface SourceReference {
  document_id: string;
  document_title: string;
  page: number;
  snippet: string;
  score: number;
  category?: string;
  department?: string;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  sources: SourceReference[];
  confidence_score?: number;
  confidence_level?: string;
  is_unknown: boolean;
  created_at: string;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceReference[];
  confidence_score?: number;
  is_unknown: boolean;
  created_at: string;
  feedback?: { id: string; rating: 'up' | 'down'; comment?: string } | null;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: MessageItem[];
}

export const chatApi = {
  getConversations: async (): Promise<ConversationSummary[]> => {
    return apiFetch<ConversationSummary[]>('/api/chat/conversations');
  },

  getConversation: async (id: string): Promise<ConversationDetail> => {
    return apiFetch<ConversationDetail>(`/api/chat/conversations/${id}`);
  },

  deleteConversation: async (id: string) => {
    return apiFetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
  },

  query: async (data: {
    query: string;
    conversation_id?: string | null;
    category?: string | null;
    department?: string | null;
  }): Promise<ChatResponse> => {
    return apiFetch<ChatResponse>('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ ...data, stream: false }),
    });
  },

  submitFeedback: async (message_id: string, rating: 'up' | 'down', comment?: string) => {
    return apiFetch('/api/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({ message_id, rating, comment }),
    });
  },

  streamQuery: async ({
    query,
    conversation_id,
    category,
    department,
    onStart,
    onToken,
    onDone,
    onError,
  }: {
    query: string;
    conversation_id?: string | null;
    category?: string | null;
    department?: string | null;
    onStart?: (data: {
      conversation_id: string;
      message_id: string;
      sources: SourceReference[];
      confidence_score?: number;
      confidence_level?: string;
      is_unknown: boolean;
    }) => void;
    onToken?: (token: string) => void;
    onDone?: (message_id: string) => void;
    onError?: (err: Error) => void;
  }) => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/api/chat/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          conversation_id,
          category,
          department,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat query failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming response body unavailable');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'start' && onStart) {
                onStart(data);
              } else if (currentEvent === 'token' && onToken) {
                onToken(data.token);
              } else if (currentEvent === 'done' && onDone) {
                onDone(data.message_id);
              }
            } catch (e) {
              console.error('Error parsing SSE data', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (onError) onError(err);
      else console.error('Streaming error:', err);
    }
  },
};

// ----------------- Documents API -----------------
export interface DocumentItem {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size: number;
  category: string;
  department?: string;
  version: number;
  status: 'processing' | 'indexed' | 'failed';
  error_message?: string;
  uploaded_by?: string;
  uploaded_at: string;
  chunk_count: number;
}

export const documentsApi = {
  getDocuments: async (params: {
    category?: string;
    status_filter?: string;
    department?: string;
    search?: string;
  } = {}): Promise<{ total: number; items: DocumentItem[] }> => {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.status_filter) q.set('status_filter', params.status_filter);
    if (params.department) q.set('department', params.department);
    if (params.search) q.set('search', params.search);

    return apiFetch<{ total: number; items: DocumentItem[] }>(`/api/documents?${q.toString()}`);
  },

  uploadDocument: async (
    file: File,
    title?: string,
    category = 'other',
    department?: string
  ): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('category', category);
    if (department) formData.append('department', department);

    return apiFetch<DocumentItem>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  updateDocument: async (
    id: string,
    data: { title?: string; category?: string; department?: string }
  ): Promise<DocumentItem> => {
    return apiFetch<DocumentItem>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteDocument: async (id: string) => {
    return apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
  },

  reprocessDocument: async (id: string): Promise<DocumentItem> => {
    return apiFetch<DocumentItem>(`/api/documents/${id}/reprocess`, { method: 'POST' });
  },

  getDownloadUrl: (id: string): string => {
    return `${API_BASE}/api/documents/${id}/download`;
  }
};

// ----------------- Admin API -----------------
export interface AnalyticsOverview {
  total_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_queries: number;
  unanswered_queries: number;
  unanswered_rate_percentage: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  satisfaction_rate_percentage: number;
  category_distribution: Record<string, number>;
  recent_activity: { id: string; query: string; created_at: string }[];
  top_queries: { query: string; count: number }[];
}

export interface UserManagementItem {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  conversation_count: number;
  document_count: number;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export const adminApi = {
  getAnalytics: async (): Promise<AnalyticsOverview> => {
    return apiFetch<AnalyticsOverview>('/api/admin/analytics');
  },

  getUsers: async (): Promise<UserManagementItem[]> => {
    return apiFetch<UserManagementItem[]>('/api/admin/users');
  },

  updateUserRole: async (userId: string, role: string): Promise<UserManagementItem> => {
    return apiFetch<UserManagementItem>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  getAuditLogs: async (limit = 50): Promise<AuditLogItem[]> => {
    return apiFetch<AuditLogItem[]>(`/api/admin/audit-logs?limit=${limit}`);
  }
};
