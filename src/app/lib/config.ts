// Environment configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://223.130.141.245.nip.io/',
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication - /api/auth/*
  register: `${config.apiUrl}/api/auth/register`,
  login: `${config.apiUrl}/api/auth/login`,
  googleLogin: `${config.apiUrl}/api/auth/google/login`,
  googleCallback: `${config.apiUrl}/api/auth/google/callback`,
  
  // User Profile - /api/user/*
  getUserProfile: `${config.apiUrl}/api/user/profile`,
  updateUsername: `${config.apiUrl}/api/user/username`,
  updateEmail: `${config.apiUrl}/api/user/email`,
  updatePassword: `${config.apiUrl}/api/user/password`,
  
  // Chat - /api/chat/*
  chat: `${config.apiUrl}/api/chat`,
  
  // Classes - /api/classes/*
  classes: `${config.apiUrl}/api/classes`,
  getClass: (classId: string) => `${config.apiUrl}/api/classes/${classId}`,
  updateClass: (classId: string) => `${config.apiUrl}/api/classes/${classId}`,
  deleteClass: (classId: string) => `${config.apiUrl}/api/classes/${classId}`,
  
  // Lectures - /api/lectures/*
  uploadAudio: `${config.apiUrl}/api/lectures/upload-audio`,
  analyzeLecture: (lectureId: string) => `${config.apiUrl}/api/lectures/${lectureId}/analyze`,
  
  // Action Items - /api/action_items/*
  actionItems: `${config.apiUrl}/api/action_items`,
  updateActionItem: (itemId: string) => `${config.apiUrl}/api/action_items/${itemId}`,
  deleteActionItem: (itemId: string) => `${config.apiUrl}/api/action_items/${itemId}`,
  getNotebook: (itemId: string) => `${config.apiUrl}/api/action_items/${itemId}/notebook`,
  updateNotebook: (notebookId: string) => `${config.apiUrl}/api/action_items/notebooks/${notebookId}`,
}
