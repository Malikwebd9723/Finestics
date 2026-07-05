// utils/notificationRouting.ts
// Maps a notification's data payload to the screen it should open.
// Shared by the push-tap handler and the in-app NotificationsScreen.

interface NotificationData {
  kind?: string;
  orderId?: number;
  vendorId?: number;
  [key: string]: any;
}

type Role = 'admin' | 'vendor' | 'customer' | undefined | null;

export function routeForNotification(
  data: NotificationData | null | undefined,
  role: Role
): { name: string; params?: object } | null {
  if (!data?.kind) return null;

  switch (data.kind) {
    case 'new_order':
    case 'order_cancelled':
      // Vendor-facing order events
      return data.orderId
        ? { name: 'VendorOrderDetailScreen', params: { orderId: data.orderId } }
        : { name: 'IncomingOrdersScreen' };

    case 'order_status':
      // Customer-facing order events
      return data.orderId
        ? { name: 'CustomerOrderDetailScreen', params: { orderId: data.orderId } }
        : null;

    case 'connection_request':
      return { name: 'ConnectionRequestsScreen' };

    case 'connection_approved':
      // Straight to the vendor so the customer can start browsing
      return data.vendorId
        ? { name: 'VendorDetailScreen', params: { vendorId: data.vendorId } }
        : { name: 'My Vendors' };

    case 'connection_rejected':
      return { name: 'My Vendors' };

    default:
      return null;
  }
}
