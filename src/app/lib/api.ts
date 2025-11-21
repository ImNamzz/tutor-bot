import { API_ENDPOINTS } from "./config";
import { getAuthHeaders, handleAuthError } from "./auth";

// Types
export interface LoginResponse {
  access_token: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  has_password: boolean;
  is_google_account: boolean;
}

export interface Class {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  lectures?: Lecture[];
  external_notes?: ExternalNote[];
}

export interface Lecture {
  id: string;
  title: string;
  transcript?: string;
  summary?: string;
  status?: string;
  object_key?: string;
  created_at: string;
  class_id: string;
  action_items?: ActionItem[];
  external_notes?: ExternalNote[];
}

export interface ActionItem {
  id: string;
  type: string;
  content: string;
  due_date?: string;
  created_at: string;
  lecture_id: string;
  user_id: string;
}

export interface NotebookPage {
  id: string;
  content: string;
  updated_at: string;
  action_item_id: string;
}

export interface ExternalNote {
  id: string;
  title: string;
  url: string;
  type: string;
  created_at: string;
  user_id: string;
  class_id?: string;
  lecture_id?: string;
}

export interface ChatResponse {
  response: string;
  chat_session_id: string;
}

export interface AnalysisResponse {
  lecture: Lecture;
  action_items: ActionItem[];
}

// Helper function for API calls
async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    handleAuthError(response.status);
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Authentication API
export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    return apiCall(API_ENDPOINTS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiCall<LoginResponse>(API_ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },
};

// User API
export const userAPI = {
  getProfile: async (): Promise<UserProfile> => {
    return apiCall<UserProfile>(API_ENDPOINTS.getUserProfile, {
      headers: getAuthHeaders(),
    });
  },

  updateUsername: async (username: string) => {
    return apiCall(API_ENDPOINTS.updateUsername, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    });
  },

  updateEmail: async (email: string) => {
    return apiCall(API_ENDPOINTS.updateEmail, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
  },

  updatePassword: async (old_password: string, new_password: string) => {
    return apiCall(API_ENDPOINTS.updatePassword, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ old_password, new_password }),
    });
  },
};

// Classes API
export const classesAPI = {
  getAll: async (): Promise<Class[]> => {
    return apiCall<Class[]>(API_ENDPOINTS.classes, {
      headers: getAuthHeaders(),
    });
  },

  create: async (title: string): Promise<Class> => {
    return apiCall<Class>(API_ENDPOINTS.classes, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
  },

  update: async (classId: string, title: string): Promise<Class> => {
    return apiCall<Class>(API_ENDPOINTS.updateClass(classId), {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
  },

  delete: async (classId: string) => {
    return apiCall(API_ENDPOINTS.deleteClass(classId), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },
};

// Lectures API
export const lecturesAPI = {
  uploadAudio: async (
    file: File,
    classId: string,
    title?: string,
    language: string = "ko-KR"
  ): Promise<Lecture> => {
    const formData = new FormData();
    formData.append("media", file);
    formData.append("class_id", classId);
    formData.append("language", language);
    if (title) formData.append("title", title);

    const token = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.uploadAudio, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      handleAuthError(response.status);
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  analyze: async (lectureId: string): Promise<AnalysisResponse> => {
    return apiCall<AnalysisResponse>(API_ENDPOINTS.analyzeLecture(lectureId), {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  checkStatus: async (lectureId: string): Promise<Lecture> => {
    return apiCall<Lecture>(API_ENDPOINTS.getLectureStatus(lectureId), {
      headers: getAuthHeaders(),
    });
  },

  get: async (lectureId: string): Promise<Lecture> => {
    return apiCall<Lecture>(API_ENDPOINTS.getLecture(lectureId), {
      headers: getAuthHeaders(),
    });
  },
};

// Chat API
export const chatAPI = {
  send: async (
    message: string,
    chatSessionId?: string
  ): Promise<ChatResponse> => {
    return apiCall<ChatResponse>(API_ENDPOINTS.chat, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        chat_session_id: chatSessionId,
      }),
    });
  },
};

// Action Items API
export const actionItemsAPI = {
  getAll: async (): Promise<ActionItem[]> => {
    return apiCall<ActionItem[]>(API_ENDPOINTS.actionItems, {
      headers: getAuthHeaders(),
    });
  },

  update: async (
    itemId: string,
    data: Partial<{ content: string; type: string; due_date: string }>
  ): Promise<ActionItem> => {
    return apiCall<ActionItem>(API_ENDPOINTS.updateActionItem(itemId), {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  delete: async (itemId: string) => {
    return apiCall(API_ENDPOINTS.deleteActionItem(itemId), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  getNotebook: async (itemId: string): Promise<NotebookPage> => {
    return apiCall<NotebookPage>(API_ENDPOINTS.getNotebook(itemId), {
      headers: getAuthHeaders(),
    });
  },

  updateNotebook: async (notebookId: string, content: string): Promise<NotebookPage> => {
    return apiCall<NotebookPage>(API_ENDPOINTS.updateNotebook(notebookId), {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
  },
};
