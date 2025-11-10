// Authentication utility functions

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const setAccessToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
};

export const removeAccessToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const handleAuthError = (status: number): void => {
  if (status === 401) {
    // Unauthorized - token expired or invalid
    removeAccessToken();
    window.location.href = "/auth/login";
  }
};
