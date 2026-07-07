// api/actions/authActions.ts

import { apiRequest } from '../clients';

// ==================== TYPES ====================

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'vendor' | 'customer' | 'admin';
  accountStatus: 'active' | 'suspended' | 'deleted';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  expiresAt: string;
}

export type ProfileStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: 'vendor' | 'customer';
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
  session: Session;
  requiresOnboarding?: boolean;
  profileStatus?: ProfileStatus;
  rejectionReason?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Login user
 */
export const loginUser = async (data: LoginRequest) => {
  const response = await apiRequest('/auth/login', 'POST', data);
  return response;
};

/**
 * Signup new user. Pass role: 'customer' for self-serve customer accounts
 * (activated immediately, no onboarding). Defaults to vendor server-side.
 */
export const signupUser = async (data: SignupRequest) => {
  const response = await apiRequest('/auth/signup', 'POST', data);
  return response;
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  const response = await apiRequest('/auth/logout', 'DELETE');
  return response;
};

/**
 * Refresh access token
 */
export const refreshToken = async (token: string) => {
  const response = await apiRequest('/auth/refresh-token', 'POST', { refreshToken: token });
  return response;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async () => {
  const response = await apiRequest('/auth/me', 'GET');
  return response;
};

/**
 * Request a password-reset code (emailed as a 6-digit code).
 * Response is always a neutral success so it never reveals whether the
 * email exists.
 */
export const requestPasswordReset = async (email: string) => {
  const response = await apiRequest('/auth/forgot-password', 'POST', { email });
  return response;
};

/**
 * Reset password with the emailed 6-digit code.
 */
export const resetPassword = async (email: string, code: string, password: string) => {
  const response = await apiRequest('/auth/reset-password', 'POST', { email, code, password });
  return response;
};
