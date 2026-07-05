# Customer Module — Part 3 of 3 (Handoff & Test Guide)

**Branch:** `feature/customer-module` (both repos)
**Builds on:** Part 1 (marketplace + connections), Part 2 (cart + checkout + orders)
**Scope of this part:** Push + in-app notifications, customer profile & addresses, invoice download, vendor linked-account view — and a critical set of database migrations.

---

## 1. ⚠️ Critical first: run the migrations

**Part 2 could not actually run against a fresh database.** The `Order`, `OrderItem`, `OrderStatusHistory`, and `Notification` models existed in code but **never had migrations**, and the backend does not `sync()` models (it only authenticates). Part 3 ships a guarded migration that creates those four tables (skipping any that already exist), plus the new `device_tokens` table.

```bash
cd finestics-backend
npm install            # adds expo-server-sdk (push delivery)
npm run migrate:dev    # creates orders, order_items, order_status_history,
                       # notifications, device_tokens
npm run dev
```

```bash
cd finestics-app
npm install            # adds expo-notifications, expo-device (SDK 54 matched)
npm start
```

---

## 2. What's included in this part

**Notifications (both roles):**
- **In-app inbox** — the Notifications screen (header bell / drawer item) now shows a real feed: order updates and connection activity, with unread badge, mark-read on tap, and "Mark all read". The drawer badge shows the live unread count (previously a hardcoded "3").
- **Push notifications** — the app registers an Expo push token after login; the backend stores per-device tokens and delivers pushes for six events:
  - vendor ← new connection request, new order, order cancelled by customer
  - customer ← connection approved/declined, order status changes, order cancelled by vendor
- **Tap-to-open** — tapping a push (or an inbox row) deep-links to the right screen (order detail, connection requests, vendor page).
- Dead tokens are auto-deactivated; tokens are deactivated server-side on logout.

**Customer account:**
- **My Profile** (drawer) — view/edit name and phone (uses the existing `PUT /users/me`).
- **Addresses** (drawer) — manage saved delivery addresses; add/delete; primary flag.
- **Invoice** — "View Invoice" on any non-cancelled order opens a clean invoice sheet with **Save to Gallery** (saved to an "Invoices" album).

**Vendor:**
- **Linked App Account** section in the customer detail modal — when a customer record is linked to a self-serve app user, the vendor sees who (name, login email, connection status).

**Design-system retrofit:**
- Status badges (order + connection) now derive from theme tones instead of hard-coded pastel hexes — correct in dark mode, consistent with `components/ui`.
- Credit-limit and cancelled-order banners use theme `error` tints.
- Drawer icons migrated to MaterialCommunityIcons; logout uses theme colors.

### New endpoints

| Method | Path | Role |
|---|---|---|
| POST | `/devices/register-token` `{ token, platform }` | any |
| DELETE | `/devices/token` `{ token }` | any |
| GET | `/notifications` → `data[] + unreadCount` | any |
| PATCH | `/notifications/:id/read` | any |
| PATCH | `/notifications/read-all` | any |

---

## 3. ⚠️ Push requires a development build (not Expo Go)

Since Expo SDK 53, **remote push does not work inside Expo Go**. Everything else works there (the app silently skips token registration), and both sides still see updates via the in-app inbox + 30s polling.

To test real push end-to-end you need a development or preview build:

```bash
eas build --profile development --platform android   # or preview
```

The EAS project ID is already in `app.json` (`extra.eas.projectId`), and the `expo-notifications` plugin is configured. Android uses a `default` notification channel; permission is requested on first login.

---

## 4. Test path

1. Run migrations + start backend; point `config.ts` at it (same as Parts 1–2).
2. **In-app flow (works in Expo Go):** place an order as the customer → as the vendor open the drawer — the **Notifications badge** shows the new-order alert; open the inbox, tap the row → lands on the order. Advance the order status → customer's inbox shows "Order update … is out for delivery" etc.
3. **Push flow (dev build):** log in on two physical devices. Repeat step 2 — each side should receive system push banners; tapping one opens the relevant screen, including from a cold start.
4. **Profile:** drawer → My Profile → Edit Details → change phone → Save; reload shows the new value.
5. **Addresses:** drawer → Addresses → Add Address → it appears at checkout; tap a row to delete it.
6. **Invoice:** open a delivered order → View Invoice → Save to Gallery → image appears in the "Invoices" album.
7. **Vendor linked account:** open a customer in the vendor's Customers screen who signed up via the app — the "Linked App Account" section shows their login identity.

---

## 5. Notes & limitations

- Notification `type` values reuse the existing model enum (`order_status`, `system`) — no schema change; the payload's `data.kind` drives deep-linking.
- Push delivery is **best-effort and fire-and-forget**: a push failure never fails the originating request; the in-app inbox is the source of truth.
- Receipt polling / delivery analytics for push are deferred (v2).
- The invoice renders in the current theme (dark invoice in dark mode) by design.
- The legacy dead files (`order.service.js`, `order.controller.js`, `order.routes.js`) remain unmounted; safe to delete in a cleanup pass.

---

## 6. Files added/changed (Part 3)

**Backend**
- `src/migrations/20260624100000-create-order-and-notification-tables.js` (new, guarded)
- `src/migrations/20260624100100-create-device-tokens.js` (new)
- `src/models/DeviceToken.js` (new); `src/models/index.js`, `src/models/User.js`
- `src/services/pushDispatcher.js`, `src/services/notification.service.js` (new)
- `src/services/connection.service.js`, `src/services/customerOrder.service.js` (notification hooks), `src/services/vendorCustomer.service.js` (customerUser include)
- `src/controllers/device.controller.js`, `src/controllers/notification.controller.js` (new)
- `src/routes/device.routes.js`, `src/routes/notification.routes.js` (new); `src/routes/routeLoader.js`
- `package.json` (+ expo-server-sdk)

**App**
- `context/NotificationContext.tsx`, `navigation/navigationRef.ts`, `utils/notificationRouting.ts` (new)
- `api/actions/notificationActions.ts`, `api/actions/customerProfileActions.ts` (new)
- `screens/NotificationsScreen.tsx` (placeholder → real feed)
- `screens/Customer/MyProfileScreen.tsx`, `AddressesScreen.tsx` (new)
- `screens/Customer/components/AddAddressModal.tsx` (extracted), `InvoiceModal.tsx` (new)
- `screens/Customer/components/OrderStatusBadge.tsx`, `ConnectionStatusBadge.tsx`, `utils/orderStatus.ts` (theme tones)
- `screens/Customer/CheckoutScreen.tsx`, `OrderDetailScreen.tsx` (invoice button, theme banners)
- `screens/Vendor/components/CustomerDetailModal.tsx` (Linked App Account)
- `navigation/DrawerNavigator.tsx` (badge, wiring, logout cleanup), `navigation/NavigationItems.ts`
- `App.tsx`, `app.json`, `package.json` (+ expo-notifications, expo-device)
