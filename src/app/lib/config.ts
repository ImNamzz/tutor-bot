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
  
  // Chat
  startSession: `${config.apiUrl}/api/start_session`,
  chat: `${config.apiUrl}/api/chat`,
}
