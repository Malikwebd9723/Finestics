// utils/notificationRouting.ts
// Maps a notification's data payload to the screen it should open.
// Shared by the push-tap handler and the in-app NotificationsScreen.
//
// Both callers navigate from ROOT context (the root stack / navigationRef),
// where only 'Main', 'Onboarding', auth and a few standalone screens exist.
// Every target below lives INSIDE the drawer (route 'Main'), so routes are
// returned as nested descriptors: navigate('Main', { screen, params }).

interface NotificationData {
  kind?: string;
  orderId?: number;
  vendorId?: number;
  [key: string]: any;
}

type Role = 'admin' | 'vendor' | 'customer' | undefined | null;

export interface NotificationRoute {
  name: string;
  params?: object;
}

/** A drawer-registered screen, reachable from root via the 'Main' route. */
const inDrawer = (screen: string, params?: object): NotificationRoute => ({
  name: 'Main',
  params: params ? { screen, params } : { screen },
});

/** A bottom tab (registered by its label inside MainTabs inside the drawer). */
const inTabs = (tabLabel: string): NotificationRoute => ({
  name: 'Main',
  params: { screen: 'MainTabs', params: { screen: tabLabel } },
});

export function routeForNotification(
  data: NotificationData | null | undefined,
  role: Role
): NotificationRoute | null {
  if (!data?.kind) return null;

  switch (data.kind) {
    case 'new_order':
    case 'order_cancelled':
      // Vendor-facing order events. Without an orderId, land on the Orders
      // tab, where new app orders queue for acceptance.
      return data.orderId
        ? inDrawer('VendorOrderDetailScreen', { orderId: data.orderId })
        : inTabs('Orders');

    case 'order_status':
      // Customer-facing order events
      return data.orderId
        ? inDrawer('CustomerOrderDetailScreen', { orderId: data.orderId })
        : null;

    case 'connection_request':
      return inDrawer('ConnectionRequestsScreen');

    case 'connection_approved':
      // Straight to the vendor so the customer can start browsing
      return data.vendorId
        ? inDrawer('VendorDetailScreen', { vendorId: data.vendorId })
        : inTabs('My Vendors');

    case 'connection_rejected':
      return inTabs('My Vendors');

    case 'application_submitted':
    case 'application_resubmitted':
      // Admin: jump to the relevant approval queue
      return data.role === 'customer' ? inDrawer('Users') : inDrawer('Vendors');

    default:
      return null;
  }
}
