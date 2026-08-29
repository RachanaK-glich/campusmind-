export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'super_admin' | string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile;
}

const TOKEN_KEY = 'campusmind_access_token';
const REFRESH_KEY = 'campusmind_refresh_token';
const USER_KEY = 'campusmind_user';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setAuthSession = (authData: AuthTokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, authData.access_token);
  localStorage.setItem(REFRESH_KEY, authData.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin' || user?.role === 'super_admin';
};

export const isSuperAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'super_admin';
};
