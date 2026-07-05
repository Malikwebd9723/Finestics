// api/actions/notificationActions.ts
import { apiRequest, getErrorMessage } from '../clients';
import type { Pagination } from './marketplaceActions';

// ==================== TYPES ====================

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: {
    kind?: string;
    orderId?: number;
    vendorId?: number;
    [key: string]: any;
  } | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResult {
  items: AppNotification[];
  unreadCount: number;
  pagination: Pagination;
}

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (): Promise<NotificationsResult> => {
  const res = await apiRequest('/notifications', 'GET');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to load notifications'));
  return {
    items: res.data.data,
    unreadCount: res.data.unreadCount ?? 0,
    pagination: res.data.pagination,
  };
};

export const markNotificationRead = async (id: number) => {
  const res = await apiRequest(`/notifications/${id}/read`, 'PATCH');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to update notification'));
  return res.data.data;
};

export const markAllNotificationsRead = async () => {
  const res = await apiRequest('/notifications/read-all', 'PATCH');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to update notifications'));
  return res.data;
};

// ==================== DEVICE TOKENS ====================

export const registerDeviceToken = async (token: string, platform: string) => {
  const res = await apiRequest('/devices/register-token', 'POST', { token, platform });
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to register device'));
  return res.data;
};

export const unregisterDeviceToken = async (token: string) => {
  const res = await apiRequest('/devices/token', 'DELETE', { token });
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to unregister device'));
  return res.data;
};
