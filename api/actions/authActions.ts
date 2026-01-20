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
 * Signup new user (vendor)
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
 * Request password reset
 */
export const requestPasswordReset = async (email: string) => {
  const response = await apiRequest('/auth/forgot-password', 'POST', { email });
  return response;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, password: string) => {
  const response = await apiRequest('/auth/reset-password', 'POST', { token, password });
  return response;
};
