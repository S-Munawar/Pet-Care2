# Authentication & Role-Based Authorization System

## Overview

This document describes the complete authentication and role-based authorization (RBAC) system implemented in the Pet-Care application. The system uses **Firebase Authentication** as the identity provider and **MongoDB** as the source of truth for role lifecycle management.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Principles](#core-principles)
3. [Data Models](#data-models)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Reference](#api-reference)
7. [Role Lifecycle](#role-lifecycle)
8. [Security Considerations](#security-considerations)
9. [Setup & Configuration](#setup--configuration)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Next.js)                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  Firebase Auth  │    │   AuthContext   │    │   API Client    │          │
│  │   (Identity)    │───▶│  (Role State)   │───▶│  (HTTP Calls)   │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Bearer Token
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVER (Express.js)                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  requireAuth    │───▶│  attachDbUser   │───▶│  requireRole    │          │
│  │ (Verify Token)  │    │ (Load DB User)  │    │ (Check Access)  │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│           │                      │                      │                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │ Firebase Admin  │    │    MongoDB      │    │   Controllers   │          │
│  │  (Verify/Set)   │    │ (Source of Truth│    │   (Business)    │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Firebase Admin SDK | `server/src/config/firebaseadmin.ts` | Token verification & custom claims |
| Auth Middleware | `server/src/middleware/auth.middleware.ts` | Request authentication & authorization |
| User Model | `server/src/models/User.ts` | User data & role state |
| RoleRequest Model | `server/src/models/RoleRequest.ts` | Role request audit trail |
| VetProfile Model | `server/src/models/vet.ts` | Vet-specific verification data |
| AuthContext | `web/context/AuthContext.tsx` | Frontend auth state management |
| API Client | `web/api/api.ts` | Backend API communication |

---

## Core Principles

### 1. Firebase Authentication is the Only Identity Provider
- All user authentication happens through Firebase
- No custom password storage or session management
- Supports email/password and Google OAuth

### 2. MongoDB is the Source of Truth for Role Lifecycle
- Role assignments are stored and managed in MongoDB
- All role changes happen in MongoDB first
- Firebase custom claims are synchronized after MongoDB updates

### 3. Firebase Custom Claims are Runtime Authority
- Backend middleware reads claims from verified tokens
- Claims provide fast role checks without database queries
- Claims must be refreshed after role changes

### 4. Frontend Role Logic is UX-Only
- Frontend never enforces security
- UI adapts based on role for better user experience
- All security enforcement happens on the backend

### 5. Never Trust Client-Provided Data
- Role and status from client requests are ignored
- All role information is loaded from the database
- Users cannot assign roles directly

---

## Data Models

### User Model

```typescript
interface IUser {
  firebaseUid: string;     // Primary identifier (from Firebase)
  email: string;           // User's email address
  role: Role;              // Current role: "pet-owner" | "vet" | "admin"
  roleStatus: RoleStatus;  // Status: "approved" | "pending" | "rejected"
  requestedRole?: Role;    // Role being requested (if any)
  createdAt: Date;
  updatedAt: Date;
}
```

**Role Values:**
- `pet-owner` - Default role, lowest privilege
- `vet` - Veterinarian role, requires approval
- `admin` - Administrator role, requires approval

**Role Status Values:**
- `approved` - User has full access to their role
- `pending` - Role request awaiting admin review
- `rejected` - Role request was denied

### RoleRequest Model

```typescript
interface IRoleRequest {
  userId: ObjectId;           // Reference to User
  requestedRole: Role;        // Role being requested
  status: RoleStatus;         // Request status
  reviewedBy?: ObjectId;      // Admin who reviewed
  reviewedAt?: Date;          // When reviewed
  reason?: string;            // Approval/rejection reason
  createdAt: Date;
}
```

### VetProfile Model

```typescript
interface IVetProfile {
  userId: ObjectId;           // Reference to User
  licenseNumber: string;      // Veterinary license number
  licenseCountry: string;     // Country of license
  verified: boolean;          // Verification status
  verifiedAt?: Date;          // When verified
  verificationSource?: string; // How verified
  createdAt: Date;
}
```

---

## Backend Implementation

### Middleware Chain

The authentication system uses a chain of middleware functions:

```typescript
// Example protected route
router.post(
  "/admin/approve-role",
  requireAuth,           // 1. Verify Firebase token
  attachDbUser,          // 2. Load user from MongoDB
  requireApprovedStatus, // 3. Check role is approved
  requireRole(ROLES.ADMIN), // 4. Check has admin role
  approveRoleRequest     // 5. Execute controller
);
```

### 1. requireAuth

Verifies the Firebase ID token from the Authorization header.

```typescript
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract Bearer token
  const token = req.headers.authorization?.split("Bearer ")[1];
  
  // Verify with Firebase Admin
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  // Attach to request
  req.user = decodedToken;
  next();
};
```

### 2. attachDbUser

Loads the user's role data from MongoDB.

```typescript
export const attachDbUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await User.findOne({ firebaseUid: req.user.uid });
  
  req.dbUser = {
    _id: user._id,
    role: user.role,
    roleStatus: user.roleStatus,
    requestedRole: user.requestedRole,
  };
  next();
};
```

### 3. requireApprovedStatus

Blocks users with pending or rejected role status.

```typescript
export const requireApprovedStatus = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.dbUser.roleStatus !== ROLE_STATUSES.APPROVED) {
    res.status(403).json({ message: "Role not approved" });
    return;
  }
  next();
};
```

### 4. requireRole

Checks if user has one of the allowed roles.

```typescript
export const requireRole = (...allowedRoles: Role[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!allowedRoles.includes(req.dbUser.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
```

### Firebase Claims Synchronization

After any role change in MongoDB, Firebase claims must be updated:

```typescript
// In services/user.ts
export const syncFirebaseClaims = async (
  firebaseUid: string,
  role: Role,
  roleStatus: RoleStatus
): Promise<void> => {
  await admin.auth().setCustomUserClaims(firebaseUid, {
    role,
    roleStatus,
  });
};
```

---

## Frontend Implementation

### AuthContext

The `AuthContext` provides authentication state to the entire application:

```typescript
type AuthContextType = {
  user: User | null;           // Firebase user object
  loading: boolean;            // Loading state
  role: Role | null;           // User's current role
  roleStatus: RoleStatus | null; // Role approval status
  requestedRole: Role | null;  // Pending role request
  isRegistered: boolean;       // Registered in our system
  hasPendingRequest: boolean;  // Has pending role request
  
  // Methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshUserData: () => Promise<void>;
};
```

### State Flow

```
1. User logs in via Firebase
         │
         ▼
2. onAuthStateChanged fires
         │
         ▼
3. fetchUserData() calls GET /api/user
         │
         ▼
4. Backend returns role data from MongoDB
         │
         ▼
5. Context updates: role, roleStatus, isRegistered, etc.
         │
         ▼
6. UI re-renders based on new state
```

### Protected Routes (UX Only)

```typescript
// components/ProtectedRoute.tsx
<ProtectedRoute
  allowedRoles={[ROLES.ADMIN]}
  requireRegistration={true}
  requireApproval={true}
  fallbackPath="/login"
>
  <AdminPanel />
</ProtectedRoute>
```

**Important:** This component provides UX improvements only. All security is enforced by backend middleware.

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/register
Register a new user in the system.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "requestedRole": "vet"  // Optional: "vet" or "admin"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "role": "pet-owner",
  "roleStatus": "approved",
  "requestedRole": "vet"  // If requested
}
```

#### POST /api/auth/request-role
Request a role upgrade.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "requestedRole": "vet",
  "licenseNumber": "VET12345",  // Required for vet
  "licenseCountry": "USA"       // Required for vet
}
```

**Response (201):**
```json
{
  "message": "Role upgrade request submitted for admin approval",
  "requestedRole": "vet"
}
```

### User Endpoints

#### GET /api/user
Get current user's profile.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response (200):**
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "role": "pet-owner",
  "roleStatus": "approved",
  "requestedRole": "vet",
  "hasPendingRequest": true,
  "registered": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Response (404) - Not Registered:**
```json
{
  "message": "User not registered",
  "registered": false
}
```

### Admin Endpoints

#### GET /api/admin/pending-requests
Get all pending role requests.

**Access:** Admin only

**Response (200):**
```json
{
  "requests": [
    {
      "_id": "request-id",
      "userId": {
        "_id": "user-id",
        "email": "vet@example.com",
        "firebaseUid": "firebase-uid"
      },
      "requestedRole": "vet",
      "status": "pending",
      "reason": "License: VET12345, Country: USA",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/admin/approve-role
Approve a role request.

**Access:** Admin only

**Request Body:**
```json
{
  "requestId": "role-request-id"
}
```

**Response (200):**
```json
{
  "message": "Role vet approved for user",
  "userId": "user-id",
  "newRole": "vet"
}
```

#### POST /api/admin/reject-role
Reject a role request.

**Access:** Admin only

**Request Body:**
```json
{
  "requestId": "role-request-id",
  "reason": "Invalid license number"
}
```

**Response (200):**
```json
{
  "message": "Role request rejected",
  "userId": "user-id"
}
```

---

## Role Lifecycle

### New User Registration

```
┌─────────────────┐
│  User signs up  │
│  via Firebase   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ POST /register  │────▶│ Create User in  │
│ with token      │     │ MongoDB as      │
└─────────────────┘     │ pet-owner       │
                        └────────┬────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│ No role request │                           │ Role requested  │
│ User is ready   │                           │ (vet or admin)  │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Create          │
                                              │ RoleRequest     │
                                              │ (pending)       │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Wait for admin  │
                                              │ approval        │
                                              └─────────────────┘
```

### Role Approval Flow

```
┌─────────────────┐
│ Admin reviews   │
│ pending request │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│    APPROVE      │                   │     REJECT      │
└────────┬────────┘                   └────────┬────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│ Update User     │                   │ Update          │
│ role in MongoDB │                   │ RoleRequest     │
└────────┬────────┘                   │ status=rejected │
         │                            └────────┬────────┘
         ▼                                     │
┌─────────────────┐                            ▼
│ Update Firebase │                   ┌─────────────────┐
│ custom claims   │                   │ Clear user's    │
└────────┬────────┘                   │ requestedRole   │
         │                            └─────────────────┘
         ▼
┌─────────────────┐
│ Create          │
│ VetProfile      │
│ (if vet role)   │
└─────────────────┘
```

### Token Refresh After Role Change

After a role is approved/rejected, the user must refresh their token to get updated claims:

```typescript
// Frontend: Force token refresh
await user.getIdToken(true);
await refreshUserData();
```

---

## Security Considerations

### 1. Token Verification

All API requests are verified using Firebase Admin SDK:

```typescript
const decodedToken = await admin.auth().verifyIdToken(token);
```

This ensures:
- Token is valid and not expired
- Token was issued by your Firebase project
- Token hasn't been revoked

### 2. Role Assignment Protection

- Users cannot assign roles directly
- All role selections are treated as requests
- Only admins can approve/reject role requests
- Admin role changes are recorded for audit

### 3. Privilege Escalation Prevention

```typescript
// Users can only request certain roles
if (requestedRole !== ROLES.VET && requestedRole !== ROLES.ADMIN) {
  return res.status(400).json({ message: "Invalid role requested" });
}

// Existing role check
if (dbUser.role === requestedRole && dbUser.roleStatus === ROLE_STATUSES.APPROVED) {
  return res.status(400).json({ message: "You already have this role" });
}
```

### 4. Database vs Claims Consistency

MongoDB is the source of truth. If claims diverge:

```typescript
// Service to verify and fix consistency
export const verifyClaimsConsistency = async (firebaseUid: string) => {
  const user = await User.findOne({ firebaseUid });
  const firebaseUser = await admin.auth().getUser(firebaseUid);
  
  if (user.role !== firebaseUser.customClaims?.role) {
    await syncFirebaseClaims(firebaseUid, user.role, user.roleStatus);
  }
};
```

### 5. Audit Trail

All role changes are recorded:

```typescript
// RoleRequest tracks:
{
  userId: ObjectId,
  requestedRole: Role,
  status: RoleStatus,
  reviewedBy: ObjectId,  // Who approved/rejected
  reviewedAt: Date,      // When
  reason: string         // Why
}
```

---

## Setup & Configuration

### Environment Variables

#### Server (.env)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/petcare

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=2000
FRONTEND_URL=http://localhost:3000
```

#### Web (.env.local)

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# API
NEXT_PUBLIC_API_URL=http://localhost:2000
```

### Initial Admin Setup

Create the first admin user using the setup script:

```bash
cd apps/server

# Get the Firebase UID from Firebase Console > Authentication > Users
npx ts-node -r tsconfig-paths/register scripts/user.ts <firebase-uid> <email>

# Example:
npx ts-node -r tsconfig-paths/register scripts/user.ts abc123xyz admin@example.com
```

**Important:** The user must already exist in Firebase Authentication before running this script.

---

## Troubleshooting

### Common Issues

#### 1. "Invalid or expired token"

**Cause:** Firebase token is expired or invalid.

**Solution:**
```typescript
// Force refresh token
const token = await user.getIdToken(true);
```

#### 2. "User not registered"

**Cause:** User authenticated with Firebase but hasn't completed registration.

**Solution:** Redirect to registration flow to call `POST /api/auth/register`.

#### 3. Role not updating after approval

**Cause:** Firebase custom claims not refreshed.

**Solution:**
```typescript
// Force token refresh on frontend
await user.getIdToken(true);
await refreshUserData();
```

#### 4. Firebase claims out of sync with MongoDB

**Cause:** Claims update failed or interrupted.

**Solution:**
```typescript
// Backend: Force sync
import { refreshUserClaims } from "@/services/user";
await refreshUserClaims(firebaseUid);
```

#### 5. "Admin access required" when user is admin

**Cause:** Role not properly synced or user needs token refresh.

**Solution:**
1. Check MongoDB: `db.users.findOne({ firebaseUid: "..." })`
2. Check Firebase claims in Firebase Console
3. Force sync if different:
```typescript
await syncFirebaseClaims(firebaseUid, role, roleStatus);
```

### Debug Checklist

1. ✅ Firebase token is valid (check expiration)
2. ✅ User exists in MongoDB
3. ✅ Role in MongoDB matches expected value
4. ✅ RoleStatus is "approved"
5. ✅ Firebase custom claims match MongoDB
6. ✅ Frontend has refreshed token after role change

---

## Summary

This authentication system provides:

- **Secure identity management** via Firebase Authentication
- **Flexible role-based access control** with pet-owner, vet, and admin roles
- **Auditable role lifecycle** with request/approval workflow
- **Consistent state** between MongoDB (source of truth) and Firebase (runtime)
- **Clean separation** between authentication and authorization
- **UX-friendly** frontend with proper loading and error states

All security is enforced on the backend. Frontend role checks are for UX only.
