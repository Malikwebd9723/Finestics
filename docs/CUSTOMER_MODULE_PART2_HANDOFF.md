# Customer Module — Part 2 of 3 (Handoff & Test Guide)

**Branch:** `feature/customer-module` (both repos)
**Builds on:** Part 1 (marketplace + connections)
**Scope of this part:** The ordering vertical — cart → checkout → order placement → tracking, plus the vendor order inbox.

---

## 1. What's included in this part

**Customer (new):**
- **Cart** — per-vendor cart, persisted locally (survives app restart). Add/adjust quantities from the vendor's catalog; a floating "View Cart" bar.
- **Checkout** — pick/add a delivery address, choose payment method (Cash on delivery / On credit), add notes, place the order. **Credit-limit enforcement**: credit orders that exceed the limit the vendor set are blocked with a clear message.
- **Orders tab** — list of your orders with status filters (All / Active / Delivered / Cancelled), auto-refreshing.
- **Order detail** — itemised order, a status timeline (Placed → Accepted → Preparing → Ready → Out for delivery → Delivered), and **Cancel** (while Placed or Accepted).
- **Addresses** — saved delivery addresses (add at checkout).

**Vendor (new):**
- **Incoming Orders** drawer screen — customer-placed orders for this vendor, with filters.
- **Order detail** — advance the order through its lifecycle (Accept → Start Preparing → Mark Ready → Dispatch → Mark Delivered) or reject/cancel.

**Important pre-existing bug fixed (by replacement):** the legacy `order.service.js` was written against an older schema (it imported a non-existent `Subscription` model, used `ProductPrice` history, `product.minOrderQty`/`sku`, `Address.userId`/`addressLine1`, and never set the required `Order.vendorId`). Its route was also never mounted. Part 2 introduces a clean `customerOrder.service.js` built against the **real** `Order`/`OrderItem` schema and leaves the dead legacy files untouched.

---

## 2. Backend — run the migrations and restart

From `finestics-backend` (on `feature/customer-module`):

```bash
npm install            # no new packages this part
npm run migrate:dev    # runs BOTH part-1 and part-2 migrations
npm run dev
```

**New migration:** `20260623120000-add-user-to-addresses.js` — adds `userId` to `addresses` so self-serve customers (who have no CustomerProfile) can own delivery addresses. Existing address ownership is unchanged. Roll back with `npm run migrate:undo:dev`.

### New endpoints

| Method | Path | Role |
|---|---|---|
| GET/POST | `/customer/addresses` | customer |
| PATCH/DELETE | `/customer/addresses/:id` | customer |
| POST | `/customer/orders` `{ vendorId, items[], paymentMethod, deliveryAddressId?, notes? }` | customer |
| GET | `/customer/orders?status` | customer |
| GET | `/customer/orders/:id` | customer |
| POST | `/customer/orders/:id/cancel` `{ reason }` | customer |
| GET | `/vendor/customer-orders?status` | vendor |
| GET | `/vendor/customer-orders/:id` | vendor |
| PATCH | `/vendor/customer-orders/:id/status` `{ status, notes }` | vendor |

**Pricing** is server-authoritative (the product's current `sellingPrice`), so prices can't be tampered client-side. **Credit**: non-cash orders check `currentBalance + orderTotal ≤ creditLimit` (the limit the vendor set at connection approval) and accrue against the customer's balance; cancelling an unpaid credit order reverses the accrual.

---

## 3. App — point at your backend

Same as Part 1: temporarily set `finestics-app/config.ts → BaseUrl` to your local backend (emulator `10.0.2.2`, or your LAN IP on a device). Don't commit that change.

---

## 4. End-to-end test path

Continue from a connected customer↔vendor pair (Part 1). Make sure the vendor approved the connection **with a credit limit** if you want to test credit.

1. **Build a cart** — as the customer, open a connected vendor → **Browse Catalog** → tap **Add** on a few products, adjust quantities. A "View Cart" bar appears.
2. **Checkout** — tap View Cart → **Proceed to Checkout** → add a delivery address → choose **Cash on delivery** → **Place Order**. You land on the order detail with status **Placed**.
3. **Vendor fulfils** — as the vendor, drawer → **Incoming Orders** → open the order → **Accept Order** → **Start Preparing** → **Mark Ready** → **Dispatch** → **Mark Delivered**.
4. **Customer tracks** — the customer's **Orders** tab and order timeline update (auto-refresh ~30s, or pull to refresh).
5. **Cancel path** — place another order; while it's **Placed/Accepted**, the customer can **Cancel Order**. After "Preparing" the cancel option disappears.
6. **Credit path** — switch payment to **On credit** at checkout. If `outstanding + order total` exceeds the vendor-set credit limit, the order is blocked with an "Over your credit limit" message; switch to Cash to proceed.

---

## 5. Notes & limitations

- **One cart per vendor.** Carts are local to the device and cleared on logout (logout already clears AsyncStorage).
- **Currency** is `£` (`CURRENCY` in `screens/Customer/components/ProductCard.tsx`).
- **No push notifications yet** — both sides poll (~30s) / pull to refresh. Push is Part 3.
- **Delivery date picker** is omitted for now (notes field only); the backend accepts `requestedDeliveryDate` if added later.
- **Legacy dead code:** `src/services/order.service.js`, `src/controllers/order.controller.js`, `src/routes/order.routes.js` remain in the repo but are unused/unmounted and broken against the current schema. Safe to delete in a later cleanup.

---

## 6. Files added/changed (Part 2)

**Backend**
- `src/migrations/20260623120000-add-user-to-addresses.js` (new)
- `src/models/Address.js`, `src/models/User.js`
- `src/services/customerAddress.service.js`, `src/services/customerOrder.service.js` (new)
- `src/controllers/customerOrder.controller.js`, `src/controllers/vendorOrderInbox.controller.js` (new)
- `src/validators/customerOrder.validators.js` (new)
- `src/routes/customerOrder.routes.js`, `src/routes/vendorOrderInbox.routes.js` (new)
- `src/routes/routeLoader.js`

**App**
- `api/actions/customerOrderActions.ts`, `api/actions/vendorOrderInboxActions.ts` (new)
- `utils/orderStatus.ts` (new), `context/CartContext.tsx` (new), `App.tsx`
- `screens/Customer/CartScreen.tsx`, `CheckoutScreen.tsx`, `MyOrdersScreen.tsx`, `OrderDetailScreen.tsx` (new)
- `screens/Customer/components/OrderStatusBadge.tsx` (new), `ProductCard.tsx`, `ProductCatalogScreen.tsx`
- `screens/Vendor/IncomingOrdersScreen.tsx`, `VendorOrderDetailScreen.tsx` (new)
- `navigation/NavigationItems.ts`, `navigation/TabNavigator.tsx`, `navigation/DrawerNavigator.tsx`
