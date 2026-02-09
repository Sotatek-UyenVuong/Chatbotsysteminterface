/**
 * Main API module for CAD chatbot
 * Handles document upload, chat, sessions, and image search
 */

const API_BASE = 'http://localhost:5006/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Get auth header
function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ==================== Types ====================

export interface UploadResponse {
  success: boolean;
  session_id: string;
  file_name: string;
  total_pages: number;
  images_processed?: number;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  answer?: string;  // Backend returns "answer"
  response?: string;  // Keep for compatibility
  citations?: number[];  // Backend returns citations
  sources?: Source[];
  error?: string;
}

export interface Source {
  page: number;
  content: string;
}

export interface ImageSearchResult {
  image_id: string;
  document_id: string;
  document_name: string;
  page_number: number;
  description: string;
  image_type: string;
  thumbnail_base64?: string;
  score: number;
}

export interface ImageSearchResponse {
  success: boolean;
  results: ImageSearchResult[];
  query?: string;
  total_results: number;
  error?: string;
}

export interface SessionInfo {
  session_id: string;
  file_name: string;
  created_at: string;
  message_count: number;
  document_id?: string;
}

export interface SessionsResponse {
  success: boolean;
  sessions: SessionInfo[];
}

// ==================== Upload ====================

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Upload with auth header, no timeout (let backend handle long processing)
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Chat ====================

export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Sessions ====================

export async function getSessions(): Promise<SessionsResponse> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Get sessions failed: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteSession(sessionId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Delete session failed: ${response.statusText}`);
  }

  return response.json();
}

export async function clearChatHistory(sessionId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/clear/${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Clear history failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Chatbots (if using chatbot endpoints) ====================

export async function getChatbots(): Promise<any> {
  const response = await fetch(`${API_BASE}/chatbots`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Get chatbots failed: ${response.statusText}`);
  }

  return response.json();
}

export async function createChatbot(sessionId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/chatbots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Create chatbot failed: ${response.statusText}`);
  }

  return response.json();
}

export async function addChatbotMessage(
  chatbotId: string,
  message: string
): Promise<any> {
  const response = await fetch(`${API_BASE}/chatbots/${chatbotId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      message: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Add message failed: ${response.statusText}`);
  }

  return response.json();
}

export async function clearChatbotMessages(chatbotId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/chatbots/${chatbotId}/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Clear messages failed: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteChatbot(chatbotId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/chatbots/${chatbotId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Delete chatbot failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Image Search ====================

export async function searchImages(
  query: string,
  limit: number = 10
): Promise<ImageSearchResponse> {
  const response = await fetch(`${API_BASE}/image-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      query: query,
      limit: limit,
    }),
  });

  if (!response.ok) {
    throw new Error(`Image search failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Page Images ====================

export function getPageImageUrl(
  sessionId: string,
  pageNumber: number
): string {
  const token = getAuthToken();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/page-image/${sessionId}/${pageNumber}${tokenParam}`;
}

// ==================== Document Info ====================

export async function getDocumentInfo(sessionId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/document-info/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Get document info failed: ${response.statusText}`);
  }

  return response.json();
}

