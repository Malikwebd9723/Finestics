# Customer Module — Part 1 of 3 (Handoff & Test Guide)

**Branch:** `feature/customer-module` (both `finestics-app` and `finestics-backend`)
**Built:** 2026-06-08
**Scope of this part:** Customer foundation + Marketplace + Connection flow

This is the first third of the customer module. It is fully testable end-to-end and ready
to share with the client for feedback. Cart, checkout, ordering, and push notifications
come in the next parts.

---

## 1. What's included in this part

**Customer (new):**
- Self-serve signup as a **Customer** (name, email, phone, password) — no business form, no admin approval. Account is active immediately.
- **Marketplace** tab — browse + search active vendors.
- **Vendor detail** — vendor profile, catalog preview, and a **Connect** button.
- **My Vendors** tab — Active / Pending / Rejected connections.
- **Product catalog** — full product list of a connected vendor (browse only; ordering comes next part).

**Vendor (new):**
- **Connection Requests** drawer screen — approve (set credit limit, payment terms, business type) or reject incoming customer requests.

**Not in this part (coming next):** cart, checkout, order placement, order tracking, push notifications, customer profile/address management.

---

## 2. Backend — run the migration and start the server

The backend has a new migration and new endpoints. From `finestics-backend`:

```bash
# 1. Install deps (no new packages were added in this part)
npm install

# 2. Run the new migration (adds connection columns to vendor_customers)
npm run migrate:dev

# 3. Start the dev server
npm run dev
```

**Migration added:** `src/migrations/20260608120000-add-connection-to-vendor-customers.js`
It adds to `vendor_customers`: `userId`, `connectionStatus` (default `active`), `connectionRequestedAt`, `connectionApprovedAt`, `connectionRejectionReason`; relaxes `businessName`/`contactPerson`/`phone` to nullable; adds a partial unique index on `(userId, vendorId)`.

> **Existing data is safe.** All current vendor-created customer rows default to `connectionStatus = 'active'`. To roll back: `npm run migrate:undo:dev`.

### New endpoints

| Method | Path | Role |
|---|---|---|
| GET | `/marketplace/vendors?search&city&businessType&page&limit` | customer |
| GET | `/marketplace/vendors/:vendorId` | customer |
| GET | `/marketplace/vendors/:vendorId/products?search&page&limit` | customer |
| POST | `/customer/connections` `{ vendorId }` | customer |
| GET | `/customer/connections?status` | customer |
| DELETE | `/customer/connections/:id` | customer |
| GET | `/vendor-customers/connection-requests?status=pending` | vendor |
| POST | `/vendor-customers/connection-requests/:id/approve` `{ creditLimit, paymentTerms, businessType, businessName, contactPerson, notes }` | vendor |
| POST | `/vendor-customers/connection-requests/:id/reject` `{ reason }` | vendor |
| POST | `/auth/signup` now accepts `role: 'customer' \| 'vendor'` (defaults to vendor) | public |

---

## 3. App — point it at your backend for testing

The app currently targets production: `config.ts → BaseUrl: 'https://api.finestics.com/api/v1'`.

To test against your **local** backend, temporarily change `finestics-app/config.ts`:

```ts
export const config = {
  // Android emulator: use 10.0.2.2 ; physical device: use your PC's LAN IP, e.g. http://192.168.1.20:5000/api/v1
  BaseUrl: 'http://10.0.2.2:5000/api/v1', // adjust port to your backend
};
```

> Replace the port with whatever your backend listens on. **Do not commit this change** — it's only for local testing. (Once the backend changes are deployed to `api.finestics.com`, no app config change is needed.)

Then run the app as usual (`npm start` / `npm run android` / `npm run ios`).

---

## 4. End-to-end test path (client demo script)

You'll need two accounts: one **vendor** (existing, approved & active) and one **new customer**.

1. **Sign up as a customer**
   - Open the app → Sign Up → toggle **Customer** → fill name/email/phone/password → Create Account.
   - You should land directly in the app on the **Marketplace** tab (no onboarding, no "pending approval").

2. **Browse the marketplace**
   - The Marketplace lists active vendors. Use search to filter by name.
   - Tap a vendor → see its profile + a few products.

3. **Request a connection**
   - On the vendor detail screen, tap **Connect**. The button switches to **Request Pending**.
   - Open **My Vendors → Pending** — the vendor appears there.

4. **Approve as the vendor** (log in on a second device / account)
   - Open the drawer → **Connection Requests** → you'll see the customer's request.
   - Tap **Approve**, set a credit limit + payment terms + business type → confirm.

5. **Back as the customer**
   - Pull to refresh **My Vendors** → the vendor moves to **Active**.
   - Open the vendor → tap **Browse Catalog** → see the full product list with prices.

6. **Rejection path (optional)**
   - Have the vendor **Reject** a request with a reason → the customer sees it under **My Vendors → Rejected**, and can **Request Again** from the vendor detail screen.

---

## 5. Notes & known limitations

- **Currency symbol** is set to `£` in `screens/Customer/components/ProductCard.tsx` (`CURRENCY`). Change it there if the business uses a different currency.
- **Pricing** is the single `sellingPrice` per product (same for all customers), per the agreed MVP.
- **Marketplace is customer-only** — you must be logged in as a customer to see it.
- **Auto-link:** if a vendor had already added a customer manually with the same phone/email, the customer's connection request silently attaches to that existing record (preserving any credit/balance the vendor set). The customer never sees whether a match existed.
- **No push notifications yet** — the vendor sees new requests when they open the Connection Requests screen (pull to refresh). Push arrives in a later part.
- **Signup default role** is **Customer** (the flow being tested). Vendors can switch the toggle to **Vendor** to keep the existing onboarding + approval flow.

---

## 6. Files changed

**Backend (`finestics-backend`)**
- `src/migrations/20260608120000-add-connection-to-vendor-customers.js` (new)
- `src/models/VendorCustomer.js`, `src/models/User.js`
- `src/controllers/auth.controller.js`, `src/validators/auth.validators.js`
- `src/services/marketplace.service.js` (new), `src/controllers/marketplace.controller.js` (new), `src/routes/marketplace.routes.js` (new)
- `src/services/connection.service.js` (new)
- `src/controllers/customerConnection.controller.js` (new), `src/validators/customerConnection.validators.js` (new), `src/routes/customerConnection.routes.js` (new)
- `src/controllers/vendorCustomer.controller.js`, `src/routes/vendorCustomer.routes.js`, `src/validators/vendorCustomer.validators.js`
- `src/routes/routeLoader.js`

**App (`finestics-app`)**
- `api/actions/marketplaceActions.ts` (new), `api/actions/connectionActions.ts` (new), `api/actions/authActions.ts`
- `validations/formValidationSchemas.ts`
- `navigation/RootNavigator.tsx`, `navigation/NavigationItems.ts`, `navigation/TabNavigator.tsx`, `navigation/DrawerNavigator.tsx`
- `screens/SignupScreen.tsx`
- `screens/Customer/MarketplaceScreen.tsx`, `VendorDetailScreen.tsx`, `MyVendorsScreen.tsx`, `ProductCatalogScreen.tsx` (new)
- `screens/Customer/components/VendorCard.tsx`, `ProductCard.tsx`, `ConnectionStatusBadge.tsx` (new)
- `screens/Vendor/ConnectionRequestsScreen.tsx` (new), `screens/Vendor/components/ApproveConnectionModal.tsx` (new)
