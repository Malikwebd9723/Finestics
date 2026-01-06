// api/actions/onboardingActions.ts

import { apiRequest } from '../clients';

// ==================== TYPES ====================

export type ProfileStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface OnboardingStatus {
  userId: number;
  email: string;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  role: string;
  steps: {
    roleSelected: boolean;
    businessInfoCompleted: boolean;
    addressCompleted: boolean;
    paymentPlanSelected: boolean;
  };
  profileStatus?: ProfileStatus;
  rejectionReason?: string;
}

export interface BusinessInfoRequest {
  businessName: string;
  businessType: string;
  businessPhone?: string;
  businessEmail?: string;
  businessLicense?: string;
  website?: string;
  description?: string;
}

export interface AddressRequest {
  type?: 'business' | 'billing' | 'delivery';
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  isPrimary?: boolean;
}

export interface VendorProfile {
  id: number;
  userId: number;
  businessName: string;
  businessType: string;
  description?: string;
  taxId?: string;
  businessLicense?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  status: ProfileStatus;
  isAcceptingOrders: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: number;
  type: 'business' | 'billing' | 'delivery';
  label?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get current onboarding status
 */
export const getOnboardingStatus = async () => {
  const response = await apiRequest('/onboarding/status', 'GET');
  return response;
};

/**
 * Save business information
 */
export const saveBusinessInfo = async (data: BusinessInfoRequest) => {
  const response = await apiRequest('/onboarding/business-info', 'POST', data);
  return response;
};

/**
 * Add business address
 */
export const addAddress = async (data: AddressRequest) => {
  const response = await apiRequest('/onboarding/address', 'POST', data);
  return response;
};

/**
 * Submit onboarding for approval
 */
export const submitOnboarding = async () => {
  const response = await apiRequest('/onboarding/submit', 'POST');
  return response;
};

/**
 * Update profile (for rejected users)
 */
export const updateProfile = async (data: Partial<BusinessInfoRequest>) => {
  const response = await apiRequest('/onboarding/profile', 'PUT', data);
  return response;
};

/**
 * Resubmit profile after rejection
 */
export const resubmitProfile = async () => {
  const response = await apiRequest('/onboarding/resubmit', 'POST');
  return response;
};
