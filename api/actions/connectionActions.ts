// api/actions/connectionActions.ts
import { apiRequest, getErrorMessage } from '../clients';
import { MarketplaceVendor } from './marketplaceActions';

// ==================== TYPES ====================

export type ConnectionStatus = 'pending' | 'active' | 'rejected' | 'blocked';

export interface CustomerConnection {
  id: number;
  connectionStatus: ConnectionStatus;
  connectionRequestedAt: string | null;
  connectionApprovedAt: string | null;
  connectionRejectionReason: string | null;
  creditLimit: string | null;
  currentBalance: string | null;
  paymentTerms: string | null;
  vendor: MarketplaceVendor | null;
}

export interface ConnectionRequest {
  id: number;
  connectionStatus: ConnectionStatus;
  connectionRequestedAt: string | null;
  businessName: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  creditLimit?: string | null;
  currentBalance?: string | null;
  /**
   * True when this request landed on a customer record the vendor created
   * earlier (matched by phone/email). Signup contact details are unverified —
   * the vendor should confirm the requester's identity before approving.
   */
  matchedExistingRecord?: boolean;
  customerUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
  } | null;
}

export interface ApproveConnectionPayload {
  businessName?: string;
  contactPerson?: string;
  creditLimit?: number;
  paymentTerms?: string;
  businessType?: string;
  notes?: string;
}

// ==================== CUSTOMER SIDE ====================

/**
 * Request to connect with a vendor.
 */
export const requestConnection = async (vendorId: number) => {
  const res = await apiRequest('/customer/connections', 'POST', { vendorId });
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to send connection request'));
  }
  return res.data.data;
};

/**
 * List the customer's connections (optionally filtered by status).
 */
export const getConnections = async (
  status?: ConnectionStatus
): Promise<CustomerConnection[]> => {
  const query = status ? `?status=${status}` : '';
  const res = await apiRequest(`/customer/connections${query}`, 'GET');
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to load connections'));
  }
  return res.data.data;
};

/**
 * Disconnect from a vendor.
 */
export const disconnect = async (connectionId: number) => {
  const res = await apiRequest(`/customer/connections/${connectionId}`, 'DELETE');
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to disconnect'));
  }
  return res.data;
};

// ==================== VENDOR SIDE ====================

/**
 * List pending connection requests for the vendor.
 */
export const getConnectionRequests = async (
  status: ConnectionStatus = 'pending'
): Promise<ConnectionRequest[]> => {
  const res = await apiRequest(
    `/vendor-customers/connection-requests?status=${status}`,
    'GET'
  );
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to load requests'));
  }
  return res.data.data;
};

/**
 * Approve a connection request and set credit terms.
 */
export const approveConnection = async (
  requestId: number,
  payload: ApproveConnectionPayload
) => {
  const res = await apiRequest(
    `/vendor-customers/connection-requests/${requestId}/approve`,
    'POST',
    payload
  );
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to approve request'));
  }
  return res.data.data;
};

/**
 * Reject a connection request.
 */
export const rejectConnection = async (requestId: number, reason?: string) => {
  const res = await apiRequest(
    `/vendor-customers/connection-requests/${requestId}/reject`,
    'POST',
    { reason }
  );
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to reject request'));
  }
  return res.data.data;
};
