# Admin API Specification

This document outlines the API endpoints required for the admin section of Finestics. It includes currently implemented endpoints and suggested enhancements.

> ## ⚠️ As-built deltas (July 2026) — read this first
> Sections 1–4 below were written before the backend existed. The backend now
> implements all of section 1–4 with these deviations (the **backend is the
> source of truth**; `api/actions/adminActions.ts` types mirror it exactly):
>
> 1. **Envelope**: mutations return `{ success, message, data: <entity> }`
>    (message top-level, `data` is the entity), NOT `data: { message, entity }`.
> 2. **Pagination**: `{ currentPage, totalPages, totalItems, itemsPerPage }`,
>    not `{ page, limit, total, totalPages }`. Lists accept `?page&limit`.
> 3. **Revenue definition**: platform revenue = gross order value across BOTH
>    order channels — vendor-authored wholesale orders (`vendor_orders`,
>    non-cancelled) + customer-app marketplace orders (`orders`,
>    non-cancelled/refunded). Money responses carry a `byChannel:
>    { direct: {orders, revenue}, marketplace: {orders, revenue} }` split.
> 4. **`GET /admin/dashboard/stats`**: `overview` additionally has `byChannel`;
>    `attentionRequired` = `{ pendingVendors, suspendedVendors,
>    pendingCustomers, unverifiedUsers }` (`pendingDisputes` dropped — no
>    disputes system; `pendingCustomers` added).
> 5. **`GET /admin/statistics/overview?period=week|month|quarter|year`**:
>    periods are ROLLING windows (7/30/90/365 days). Response adds `period` and
>    `range {from,to}`; `users` = `{ newUsers, activeUsers }` (`returningUsers`
>    dropped). `chartData` buckets daily (week/month), weekly (quarter),
>    monthly (year).
> 6. **`GET /admin/statistics/vendors`**: `topVendors[]` =
>    `{ id, businessName, status, totalOrders, totalRevenue }` — NO
>    `rating` (no reviews system). `vendorGrowth` = `{ labels, newVendors[] }`
>    (no `approvedVendors` series).
> 7. **`GET /admin/statistics/users`**: `{ period, totalUsers, newUsers,
>    activeUsers, usersByRole, userGrowth {labels, newUsers[]},
>    verificationRate }` — `retentionRate` dropped (no cohort tracking).
> 8. **`GET /vendors/stats`** (new): `{ total, active, pending, suspended,
>    rejected, newThisWeek, newThisMonth }`. The older
>    `GET /vendors/statistics/all` still exists with its own shape.
> 9. **`GET /vendors/:id/stats`** (reshaped): `{ vendorId, businessName,
>    status, totalOrders, totalRevenue, ordersThisMonth, revenueThisMonth,
>    totalProducts, totalCustomers, outstandingBalance, byChannel }` — no
>    rating/review fields. (`GET /vendors/me/stats` keeps its old vendor shape.)
> 10. **`GET /users/stats`** (reshaped): `{ total, active, suspended, deleted,
>    byRole, verified, unverified, newThisWeek, newThisMonth }` + extras
>    (`completedOnboarding, pendingOnboarding, pendingApprovals,
>    usersWithActivePayment`).
> 11. **`GET /users`** accepts `?status=` as an alias for `?accountStatus=`.
> 12. **Vendor rejection field** is `rejectionReason` (not `statusReason`);
>    vendor detail exposes an `addresses[]` relation (no `businessAddress`
>    string).
> 13. **Password reset** (auth, not admin): `POST /auth/forgot-password`
>    emails a 6-digit code (requires `SMTP_*` env vars);
>    `POST /auth/reset-password` takes `{ email, code, password }`.
> 14. Section 5 (activity logs, reports, settings, bulk ops, global search,
>    websockets) remains UNBUILT. Admin in-app notifications now exist via the
>    standard `/notifications` endpoints — admins are notified on application
>    submit/resubmit.

---

## Base URL
```
/api/v1
```

## Authentication
All admin endpoints require Bearer token authentication and admin role.
```
Authorization: Bearer <access_token>
```

---

## Table of Contents
1. [Dashboard & Statistics](#1-dashboard--statistics)
2. [Vendor Management](#2-vendor-management)
3. [User Management](#3-user-management)
4. [Admin Profile](#4-admin-profile)
5. [Suggested Enhancements](#5-suggested-enhancements)

---

## 1. Dashboard & Statistics

### 1.1 Get Dashboard Stats
Returns overview statistics for the admin dashboard.

**Endpoint:** `GET /admin/dashboard/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "vendors": {
      "total": 150,
      "active": 120,
      "pending": 15,
      "suspended": 10,
      "rejected": 5
    },
    "users": {
      "total": 5000,
      "active": 4500,
      "suspended": 500,
      "byRole": {
        "admin": 5,
        "vendor": 150,
        "customer": 4845
      }
    },
    "overview": {
      "totalOrders": 12500,
      "totalRevenue": 250000.00,
      "newUsersThisWeek": 120,
      "newUsersThisMonth": 450
    },
    "attentionRequired": {
      "pendingVendors": 15,
      "suspendedVendors": 10,
      "unverifiedUsers": 200,
      "pendingDisputes": 5
    }
  }
}
```

---

### 1.2 Get Platform Statistics (Overview)
Returns platform-wide statistics for a specific period.

**Endpoint:** `GET /admin/statistics/overview`

**Query Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| period | string | Yes | `week`, `month`, `quarter`, `year` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "revenue": {
      "total": 50000.00,
      "previousPeriod": 45000.00,
      "percentageChange": 11.1
    },
    "orders": {
      "total": 1200,
      "previousPeriod": 1100,
      "percentageChange": 9.1,
      "averageOrderValue": 41.67
    },
    "users": {
      "newUsers": 450,
      "activeUsers": 3200,
      "returningUsers": 2800
    },
    "chartData": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "revenue": [12000, 13000, 11500, 13500],
      "orders": [280, 310, 290, 320]
    }
  }
}
```

---

### 1.3 Get Vendor Performance Statistics
Returns vendor performance metrics.

**Endpoint:** `GET /admin/statistics/vendors`

**Query Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| period | string | Yes | `week`, `month`, `quarter`, `year` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalVendors": 150,
    "activeVendors": 120,
    "newVendors": 12,
    "topVendors": [
      {
        "id": 1,
        "businessName": "Tech Store",
        "totalOrders": 250,
        "totalRevenue": 15000.00,
        "rating": 4.8
      },
      {
        "id": 2,
        "businessName": "Fashion Hub",
        "totalOrders": 180,
        "totalRevenue": 12000.00,
        "rating": 4.6
      }
    ],
    "vendorGrowth": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "newVendors": [3, 4, 2, 3],
      "approvedVendors": [2, 3, 2, 3]
    },
    "vendorsByStatus": {
      "active": 120,
      "pending": 15,
      "suspended": 10,
      "rejected": 5
    }
  }
}
```

---

### 1.4 Get User Growth Statistics
Returns user growth and activity metrics.

**Endpoint:** `GET /admin/statistics/users`

**Query Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| period | string | Yes | `week`, `month`, `quarter`, `year` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalUsers": 5000,
    "newUsers": 450,
    "activeUsers": 3200,
    "usersByRole": {
      "admin": 5,
      "vendor": 150,
      "customer": 4845
    },
    "userGrowth": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "newUsers": [100, 120, 110, 120],
      "activeUsers": [2800, 2900, 3000, 3200]
    },
    "retentionRate": 75.5,
    "verificationRate": 85.2
  }
}
```

---

## 2. Vendor Management

### 2.1 Get All Vendors
Returns paginated list of all vendors with optional filters.

**Endpoint:** `GET /vendors`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| status | string | No | Filter by status: `pending`, `active`, `suspended`, `rejected` |
| search | string | No | Search by business name, email, or owner name |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "businessName": "Tech Store",
      "businessType": "Electronics",
      "description": "Premium electronics store",
      "businessPhone": "+1234567890",
      "businessEmail": "contact@techstore.com",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": 10,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 2.2 Get Pending Vendors
Returns vendors awaiting approval.

**Endpoint:** `GET /vendors/pending`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |

**Response:** Same as Get All Vendors, filtered to pending status.

---

### 2.3 Get Vendor by ID
Returns detailed vendor information.

**Endpoint:** `GET /vendors/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 10,
    "businessName": "Tech Store",
    "businessType": "Electronics",
    "description": "Premium electronics store specializing in gadgets and accessories",
    "businessPhone": "+1234567890",
    "businessEmail": "contact@techstore.com",
    "businessAddress": "123 Tech Street, Silicon Valley, CA",
    "logo": "https://storage.example.com/logos/techstore.png",
    "status": "active",
    "statusReason": null,
    "approvedAt": "2024-01-20T14:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:00:00Z",
    "user": {
      "id": 10,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": null
    }
  }
}
```

---

### 2.4 Get Vendor Statistics
Returns statistics for a specific vendor.

**Endpoint:** `GET /vendors/:id/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "vendorId": 1,
    "totalOrders": 250,
    "totalRevenue": 15000.00,
    "totalProducts": 45,
    "averageRating": 4.8,
    "totalReviews": 180,
    "ordersThisMonth": 35,
    "revenueThisMonth": 2500.00
  }
}
```

---

### 2.5 Create Vendor
Creates a new vendor with associated user account.

**Endpoint:** `POST /vendors`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123",
  "businessName": "Tech Store",
  "businessType": "Electronics",
  "description": "Premium electronics store",
  "businessPhone": "+1234567890",
  "businessEmail": "contact@techstore.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor created successfully",
    "vendor": {
      "id": 1,
      "businessName": "Tech Store",
      "status": "pending"
    }
  }
}
```

---

### 2.6 Update Vendor
Updates vendor information.

**Endpoint:** `PUT /vendors/:id`

**Request Body:**
```json
{
  "businessName": "Tech Store Pro",
  "businessType": "Electronics & Gadgets",
  "description": "Updated description",
  "businessPhone": "+1234567890",
  "businessEmail": "new@techstore.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor updated successfully",
    "vendor": { ... }
  }
}
```

---

### 2.7 Approve Vendor
Approves a pending vendor.

**Endpoint:** `PATCH /vendors/:id/approve`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor approved successfully",
    "vendor": {
      "id": 1,
      "status": "active",
      "approvedAt": "2024-01-20T14:00:00Z"
    }
  }
}
```

---

### 2.8 Reject Vendor
Rejects a vendor application.

**Endpoint:** `PATCH /vendors/:id/reject`

**Request Body:**
```json
{
  "reason": "Incomplete business documentation provided"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor rejected",
    "vendor": {
      "id": 1,
      "status": "rejected",
      "statusReason": "Incomplete business documentation provided"
    }
  }
}
```

---

### 2.9 Suspend Vendor
Suspends an active vendor.

**Endpoint:** `PATCH /vendors/:id/suspend`

**Request Body:**
```json
{
  "reason": "Policy violation - selling prohibited items"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor suspended",
    "vendor": {
      "id": 1,
      "status": "suspended",
      "statusReason": "Policy violation - selling prohibited items"
    }
  }
}
```

---

### 2.10 Reactivate Vendor
Reactivates a suspended vendor.

**Endpoint:** `PATCH /vendors/:id/reactivate`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor reactivated successfully",
    "vendor": {
      "id": 1,
      "status": "active"
    }
  }
}
```

---

### 2.11 Delete Vendor
Permanently deletes a vendor.

**Endpoint:** `DELETE /vendors/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vendor deleted successfully"
  }
}
```

---

### 2.12 Get Vendors Stats Summary
Returns aggregate vendor statistics.

**Endpoint:** `GET /vendors/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "pending": 15,
    "suspended": 10,
    "rejected": 5,
    "newThisWeek": 5,
    "newThisMonth": 12
  }
}
```

---

## 3. User Management

### 3.1 Get All Users
Returns paginated list of all users with optional filters.

**Endpoint:** `GET /users`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| status | string | No | Filter by status: `active`, `suspended`, `deleted` |
| role | string | No | Filter by role: `admin`, `vendor`, `customer` |
| search | string | No | Search by name or email |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "accountStatus": "active",
      "isEmailVerified": true,
      "profileImage": null,
      "createdAt": "2024-01-10T08:00:00Z",
      "lastLoginAt": "2024-01-25T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5000,
    "totalPages": 250
  }
}
```

---

### 3.2 Get User by ID
Returns detailed user information.

**Endpoint:** `GET /users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "customer",
    "accountStatus": "active",
    "isEmailVerified": true,
    "profileImage": null,
    "createdAt": "2024-01-10T08:00:00Z",
    "lastLoginAt": "2024-01-25T15:30:00Z",
    "updatedAt": "2024-01-20T12:00:00Z",
    "customerProfile": {
      "id": 1,
      "preferences": {}
    },
    "addresses": [
      {
        "id": 1,
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA",
        "isDefault": true
      }
    ]
  }
}
```

---

### 3.3 Get User Stats Summary
Returns aggregate user statistics.

**Endpoint:** `GET /users/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5000,
    "active": 4500,
    "suspended": 450,
    "deleted": 50,
    "byRole": {
      "admin": 5,
      "vendor": 150,
      "customer": 4845
    },
    "verified": 4250,
    "unverified": 750,
    "newThisWeek": 120,
    "newThisMonth": 450
  }
}
```

---

### 3.4 Update User
Updates user information.

**Endpoint:** `PUT /users/:id`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User updated successfully",
    "user": { ... }
  }
}
```

---

### 3.5 Update User Status
Updates user account status.

**Endpoint:** `PATCH /users/:id/status`

**Request Body:**
```json
{
  "accountStatus": "suspended"
}
```

**Allowed Values:** `active`, `suspended`, `deleted`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User status updated successfully",
    "user": {
      "id": 1,
      "accountStatus": "suspended"
    }
  }
}
```

---

### 3.6 Update User Role
Updates user role.

**Endpoint:** `PATCH /users/:id/role`

**Request Body:**
```json
{
  "role": "vendor"
}
```

**Allowed Values:** `admin`, `vendor`, `customer`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User role updated successfully",
    "user": {
      "id": 1,
      "role": "vendor"
    }
  }
}
```

---

### 3.7 Delete User
Permanently deletes a user account.

**Endpoint:** `DELETE /users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

---

## 4. Admin Profile

### 4.1 Get Current Admin Profile
Returns the current logged-in admin's profile.

**Endpoint:** `GET /users/me`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@finestics.com",
    "phone": "+1234567890",
    "role": "admin",
    "accountStatus": "active",
    "isEmailVerified": true,
    "profileImage": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-25T15:30:00Z"
  }
}
```

---

### 4.2 Update Admin Profile
Updates the current admin's profile.

**Endpoint:** `PUT /users/me`

**Request Body:**
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+1234567890",
  "profileImage": "base64_encoded_image_or_url"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully",
    "user": { ... }
  }
}
```

---

## 5. Suggested Enhancements

### 5.1 Activity Logs

#### Get Admin Activity Logs
Track admin actions for audit purposes.

**Endpoint:** `GET /admin/activity-logs`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number |
| limit | number | No | Items per page |
| adminId | number | No | Filter by admin user ID |
| action | string | No | Filter by action type |
| startDate | string | No | ISO date string |
| endDate | string | No | ISO date string |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "adminId": 1,
      "adminName": "Admin User",
      "action": "VENDOR_APPROVED",
      "targetType": "vendor",
      "targetId": 5,
      "details": {
        "vendorName": "Tech Store"
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-25T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### 5.2 Notifications

#### Get Admin Notifications
**Endpoint:** `GET /admin/notifications`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "NEW_VENDOR",
      "title": "New Vendor Registration",
      "message": "Tech Store has registered and awaiting approval",
      "isRead": false,
      "createdAt": "2024-01-25T10:30:00Z",
      "data": {
        "vendorId": 5
      }
    }
  ],
  "unreadCount": 5
}
```

#### Mark Notification as Read
**Endpoint:** `PATCH /admin/notifications/:id/read`

#### Mark All Notifications as Read
**Endpoint:** `PATCH /admin/notifications/read-all`

---

### 5.3 Reports & Exports

#### Generate Report
**Endpoint:** `POST /admin/reports/generate`

**Request Body:**
```json
{
  "type": "vendors",
  "format": "csv",
  "filters": {
    "status": "active",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

**Report Types:** `vendors`, `users`, `orders`, `revenue`, `activity`
**Formats:** `csv`, `xlsx`, `pdf`

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "rpt_123456",
    "status": "processing",
    "downloadUrl": null
  }
}
```

#### Get Report Status/Download
**Endpoint:** `GET /admin/reports/:reportId`

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "rpt_123456",
    "status": "completed",
    "downloadUrl": "https://storage.example.com/reports/rpt_123456.csv",
    "expiresAt": "2024-01-26T10:30:00Z"
  }
}
```

---

### 5.4 System Settings

#### Get Platform Settings
**Endpoint:** `GET /admin/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "platformName": "Finestics",
    "platformLogo": "https://...",
    "vendorCommissionRate": 10.0,
    "autoApproveVendors": false,
    "requireEmailVerification": true,
    "maintenanceMode": false,
    "supportEmail": "support@finestics.com"
  }
}
```

#### Update Platform Settings
**Endpoint:** `PUT /admin/settings`

**Request Body:**
```json
{
  "vendorCommissionRate": 12.0,
  "autoApproveVendors": true
}
```

---

### 5.5 Bulk Operations

#### Bulk Vendor Actions
**Endpoint:** `POST /vendors/bulk-action`

**Request Body:**
```json
{
  "action": "approve",
  "vendorIds": [1, 2, 3, 4, 5],
  "reason": "Approved in bulk review"
}
```

**Actions:** `approve`, `reject`, `suspend`, `reactivate`, `delete`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Bulk action completed",
    "processed": 5,
    "failed": 0,
    "results": [
      { "id": 1, "success": true },
      { "id": 2, "success": true }
    ]
  }
}
```

#### Bulk User Actions
**Endpoint:** `POST /users/bulk-action`

**Request Body:**
```json
{
  "action": "suspend",
  "userIds": [10, 11, 12],
  "reason": "Terms violation"
}
```

---

### 5.6 Search & Filters (Enhanced)

#### Global Admin Search
Search across vendors, users, and orders.

**Endpoint:** `GET /admin/search`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| type | string | No | Filter by type: `vendors`, `users`, `orders` |
| limit | number | No | Max results per type (default: 5) |

**Response:**
```json
{
  "success": true,
  "data": {
    "vendors": [
      { "id": 1, "businessName": "Tech Store", "status": "active" }
    ],
    "users": [
      { "id": 10, "name": "John Doe", "email": "john@example.com" }
    ],
    "orders": [
      { "id": 100, "orderNumber": "ORD-2024-001", "status": "completed" }
    ]
  }
}
```

---

### 5.7 Real-time Updates (WebSocket)

#### WebSocket Events
Connect to: `wss://api.finestics.com/admin/ws`

**Events to Listen:**
```javascript
// New vendor registration
{ "event": "vendor:new", "data": { "id": 5, "businessName": "..." } }

// Vendor status change
{ "event": "vendor:status", "data": { "id": 5, "status": "approved" } }

// New user registration
{ "event": "user:new", "data": { "id": 100, "name": "..." } }

// New order
{ "event": "order:new", "data": { "id": 500, "amount": 150.00 } }

// System alert
{ "event": "system:alert", "data": { "type": "warning", "message": "..." } }
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

Admin endpoints are rate-limited:
- Standard endpoints: 100 requests/minute
- Bulk operations: 10 requests/minute
- Reports: 5 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706180400
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-25 | Initial API specification |

