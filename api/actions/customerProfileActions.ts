// api/actions/customerProfileActions.ts
import { apiRequest, getErrorMessage } from '../clients';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Update the signed-in user's own profile (any role) — PUT /users/me.
 */
export const updateMyProfile = async (data: UpdateProfilePayload) => {
  const res = await apiRequest('/users/me', 'PUT', data);
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to update profile'));
  return res.data.data;
};
