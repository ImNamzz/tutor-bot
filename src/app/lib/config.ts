// Environment configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  register: `${config.apiUrl}/api/register`,
  login: `${config.apiUrl}/api/login`,
  verifyEmail: (token: string) => `${config.apiUrl}/api/verify_email/${token}`,
  resendVerification: `${config.apiUrl}/api/resend_verification`,
  googleLogin: `${config.apiUrl}/api/auth/google/login`,
  googleCallback: `${config.apiUrl}/api/auth/google/callback`,
  
  // User Profile
  getUserProfile: `${config.apiUrl}/api/user/profile`,
  updateUserProfile: `${config.apiUrl}/api/user/profile`,
  updateUsername: `${config.apiUrl}/api/user/username`,
  updatePassword: `${config.apiUrl}/api/user/password`,
  
  // Chat
  chat: `${config.apiUrl}/api/chat`,
  
  // Lectures
  uploadAudio: `${config.apiUrl}/api/lectures/upload-audio`,
  uploadLecture: `${config.apiUrl}/api/lectures`,
  startChatFromLecture: (lectureId: number) => `${config.apiUrl}/api/lectures/${lectureId}/start-chat`,
}
