# SUVMS — Smart University Visitor Management System

> **Software Engineering Course Project**  
> A full-stack, role-gated visitor management platform that modernizes physical paper visitor registers at university gates with real-time digital pre-registration, guard clearance, campus security blacklist enforcement, QR visitor passes, executive reporting, and automated audit trails.

---

## 1. Quick Start Guide

### Prerequisites
- Node.js >= 22 (uses built-in `node:sqlite` — zero external C++ build tool dependencies)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Installation & Launch

```bash
# 1. Navigate to the project root
cd suvms

# 2. Install dependencies for all workspaces (server & client)
npm install

# 3. Seed the SQLite database with departments, demo users, visits, and blacklist entries
npm run seed

# 4. Launch both Backend (port 3001) and Frontend (port 5173) with a single command
npm run dev

# 5. Run the automated Lifecycle & RBAC test suite
npm test
```

- **Frontend Portal:** [http://localhost:5173](http://localhost:5173)  
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)  
- **API Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health)  

---

## 2. Demo User Accounts

All roles are seeded and ready for immediate demonstration:

| Role | Account Name | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@suvms.edu` | `Admin@123` | Analytics dashboard, manage all users, manage security blacklist, CSV export |
| **Guard 1** | Rajan Kumar (Main Gate) | `guard1@suvms.edu` | `Guard@123` | Real-time gate control, verify arrivals, check-in/out, walk-in registration, delivery shortcut |
| **Guard 2** | Vikram Singh (North Gate) | `guard2@suvms.edu` | `Guard@123` | Gate operations, vehicle number recording, blacklist screening, record search |
| **Member** | Arjun Sharma (Student) | `arjun@suvms.edu` | `Member@123` | Pre-register visitors, digital QR pass, cancel visits, arrival notifications |
| **Member** | Priya Patel (Student) | `priya@suvms.edu` | `Member@123` | Pre-register visitors, track visitor history |
| **Member** | Prof. Meena Iyer (Faculty) | `meena@suvms.edu` | `Member@123` | Pre-register academic guests and speakers |
| **Member** | Dr. Ramesh Sen (Faculty) | `ramesh@suvms.edu` | `Member@123` | Pre-register academic visitors, departmental visits |
| **Member** | Kavita Das (Employee) | `kavita@suvms.edu` | `Member@123` | Pre-register maintenance / contractor visits |
| **Member** | Prof. P.K. Director | `director@suvms.edu` | `Member@123` | Pre-register VIP delegates |

> **Note on Security:** Members can self-register via the `/signup` screen. Security Guard and Administrator accounts can **only** be created by an authenticated Administrator via the Admin User Management portal (`/admin/users`).

---

## 3. System Architecture & Tech Stack

```
SUVMS Full-Stack Architecture
├── Client (React 18 + Vite + Tailwind CSS + Recharts + qrcode.react)
│   ├── Contexts: AuthContext (JWT memory + persistent session)
│   ├── Hooks: usePolling (5s background sync), useToast, useAuth
│   ├── Layouts: Responsive Navbar with live notification counter & PageShell
│   └── Pages: Public (Login, Signup), Member, Guard, Admin
│
└── Server (Node.js + Express MVC)
    ├── Security: bcryptjs password hashing, JWT stateless tokens, Zod validation
    ├── Database: SQLite (WAL mode, foreign keys, 10 B-tree indexes) via node:sqlite
    └── Middleware: verifyToken, requireRole (RBAC), validate (Zod schemas)
```

---

## 4. Visit Status Lifecycle State Machine

Status transitions are strictly enforced in the backend service layer (`server/services/visits.service.js`):

```
       [Pre-Register]
             │
             ▼
        ┌──────────┐      Guard Verify
        │ Expected ├─────────────────────────┐
        └────┬─────┘                         │
             │                               ▼
    Host     │ Cancel                   ┌──────────┐     Guard Check-In     ┌────────────┐
   Cancel    ▼                          │ Verified ├───────────────────────►│ Checked In │
        ┌───────────┐                   └────┬─────┘  (stamps check_in_time)└─────┬──────┘
        │ Cancelled │                        │                                    │
        └───────────┘                        │                                    ▼ Guard Check-Out
                                             │                              ┌─────────────┐
             ┌───────────────────────────────┘                              │ Checked Out │
             ▼ Guard Deny / Blacklist Hit                                   └─────────────┘
        ┌──────────┐                                                   (stamps check_out_time)
        │  Denied  │
        └──────────┘
```

- **Check-In** is **only** permitted from the `Verified` state.
- **Check-Out** is **only** permitted from the `Checked In` state.
- **Cancel** is restricted to the host member, and only while the visit is `Expected`.
- **Blacklist Screening:** Triggered on creation, verification, and check-in. Any match against active phone, name, or vehicle number halts the transition and creates an entry in `BlacklistHitLog`.

---

## 5. Requirements Traceability Matrix (R1 – R21)

Every functional requirement from SRS v1.0 and MoSCoW prioritization is mapped directly to its implementation files and API endpoints:

| Req ID | Requirement Description | Priority | Backend Implementation | Frontend Implementation | API Endpoints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | Member Registration & Authentication | Must Have | `auth.service.js`, `auth.controller.js` | `LoginPage.jsx`, `SignupPage.jsx` | `POST /api/auth/signup`<br>`POST /api/auth/login`<br>`GET /api/auth/me` |
| **R2** | Visitor Pre-Registration & Cancellation | Must Have | `visits.service.js`, `visit.schema.js` | `PreRegisterPage.jsx`, `MyVisitorsPage.jsx` | `POST /api/visits`<br>`GET /api/visits/my`<br>`PATCH /api/visits/:id/cancel` |
| **R3** | Guard Dashboard with 5 Big Action Buttons | Must Have | `visits.service.js` | `GuardDashboardPage.jsx` | `GET /api/visits/dashboard` |
| **R4** | Guard Verification Workflow | Must Have | `visits.service.js` | `VisitDetailPage.jsx`, `GuardDashboardPage.jsx` | `PATCH /api/visits/:id/verify`<br>`GET /api/visits/:id` |
| **R5** | Vehicle Details Recording & Editing | Must Have | `visits.service.js`, `schema.sql` | `VisitDetailPage.jsx`, `WalkInPage.jsx` | `POST /api/visits/:id/vehicle`<br>`PATCH /api/visits/:id/vehicle` |
| **R6** | Walk-In Visitor Registration | Must Have | `visits.service.js`, `visit.schema.js` | `WalkInPage.jsx` | `POST /api/visits/walkin` |
| **R7** | Delivery Personnel Fast-Track Entry | Must Have | `visits.service.js` | `WalkInPage.jsx?type=delivery`, `GuardDashboardPage.jsx` | `POST /api/visits/walkin` |
| **R8** | Server-Side Check-In with Timestamps | Must Have | `visits.service.js` | `VisitDetailPage.jsx`, `GuardDashboardPage.jsx` | `PATCH /api/visits/:id/checkin` |
| **R9** | Server-Side Check-Out with Timestamps | Must Have | `visits.service.js` | `VisitDetailPage.jsx`, `GuardDashboardPage.jsx` | `PATCH /api/visits/:id/checkout` |
| **R10**| Real-Time 5s Polling & Immediate DB Writes | Must Have | `db.js` (WAL mode) | `usePolling.js` (5000ms hook) | Polling `GET /api/visits/dashboard` |
| **R11**| Visitor Records Directory Search | Must Have | `visits.service.js` | `VisitorRecordsPage.jsx` | `GET /api/visits/search` |
| **R12**| Role-Based Access Control (RBAC) | Must Have | `rbac.js`, `auth.js` | `App.jsx` (`ProtectedRoute`) | Enforced globally on all routes |
| **R13**| Guard UI Simplicity & Large Touch Targets | Must Have | N/A (UI standard) | `GuardDashboardPage.jsx`, `VisitDetailPage.jsx` | High-contrast Tailwind UI |
| **R14**| Sub-Second High Performance | Must Have | `schema.sql` (10 DB indexes) | Vite bundling & fast JSON | B-tree index scans on name, phone, vehicle |
| **R15**| Admin Advanced Search & CSV Export | Should Have | `visits.service.js`, `visits.controller.js` | `AdminVisitorRecordsPage.jsx` | `GET /api/visits/export/csv`<br>`GET /api/visits/search` |
| **R16**| Admin User Management & Role Assignment | Should Have | `users.service.js`, `users.controller.js` | `AdminUserManagementPage.jsx` | `GET /api/users`<br>`POST /api/users`<br>`PATCH /api/users/:id` |
| **R17**| Admin Statistics & Interactive Charts | Should Have | `stats.service.js`, `stats.controller.js` | `AdminOverviewPage.jsx` (Recharts) | `GET /api/stats/summary`<br>`GET /api/stats/by-type`<br>`GET /api/stats/by-date` |
| **R18**| Digital QR Visitor Entry Pass | Could Have | N/A (Frontend standard) | `QRCodeModal.jsx` (`qrcode.react`) | Rendered in `MyVisitorsPage` & `VisitDetailPage` |
| **R19**| Host In-App Gate Arrival Notifications | Could Have | `notifications.service.js` | `NotificationsPage.jsx`, `Navbar.jsx` badge | `GET /api/notifications`<br>`PATCH /api/notifications/:id/read` |
| **R20**| Audit Logs & Historical Record Preservation | Non-Func | `schema.sql`, `schema.sql` | `AdminBlacklistPage.jsx`, `AdminVisitorRecordsPage.jsx` | Soft-deletes & `BlacklistHitLog` table |
| **R21**| Campus Security Blacklist & Override | Must Have | `blacklist.service.js`, `schema.sql` | `AdminBlacklistPage.jsx`, `BlacklistWarningBanner.jsx` | `GET /api/blacklist`<br>`POST /api/blacklist`<br>`POST /api/blacklist/check` |

---

## 6. Automated Testing

Run the automated test suite anytime with:

```bash
npm test
```

The test runner exercises:
1. Admin, Guard, and Member JWT issuance.
2. Unauthenticated and cross-role unauthorized access blocks (401/403).
3. Private visit record isolation between internal members.
4. Complete 4-step status lifecycle state machine:
   - `Expected` -> `Verified` -> `Checked In` -> `Checked Out`.
5. Prevention of invalid state skips (e.g., trying to check in directly from `Expected` returns 400).
6. Blacklist matching on prohibited phone number, generating audit logs, and blocking check-in with 403.
7. Supervisor override authorization and status progression.
8. Generation of in-app notification for the host member upon check-in.

---

## 7. Manual Test Checklist for Live Demo

### Scenario A: Member Pre-Registration & Digital Pass
1. Log in as `arjun@suvms.edu` / `Member@123`.
2. Click **Pre-Register Visitor**.
3. Fill in visitor name, phone number, choose "Guest", set expected date (today or tomorrow), and enter vehicle details (e.g., `DL-01-AB-1234`).
4. Click **Confirm Pre-Registration**. You are redirected to **My Visitors** with a success toast.
5. Click **QR Pass** on the new visit card. Verify that the digital pass with QR code and visitor details appears.

### Scenario B: Guard Verification & Check-In
1. Log in as `guard1@suvms.edu` / `Guard@123`.
2. On the **Guard Dashboard**, note the top search bar, the 5 big action tiles, and the live 5s auto-refresh counter.
3. In **Today's Expected Arrivals**, locate the visitor pre-registered in Scenario A.
4. Click **Verify** (status changes to `Verified`).
5. Click **Check-In** (status changes to `Checked In`, timestamp is stamped, and headcount counter increases).
6. Log back in as `arjun@suvms.edu`. Observe the red notification badge on **Notifications** and view the arrival alert.

### Scenario C: Delivery Shortcut (Courier Clearance)
1. Log in as `guard1@suvms.edu`.
2. Click the **Delivery Shortcut** tile.
3. Observe that category is pre-filled as "Delivery / Courier" and purpose as "Parcel Delivery".
4. Enter delivery person's name and phone, select a host member or department, and click **Register Walk-In & Proceed**.
5. Click **Check-In Now** with 1 click.

### Scenario D: Security Blacklist Detection & Override
1. As Guard, click **Walk-in Visitor**.
2. Enter visitor name "Deepak Joshi" or phone "9123456789" (seeded blacklist entry).
3. Complete the form and click **Register Walk-In & Proceed**.
4. Observe the prominent red **SECURITY WARNING: Blacklist Match Detected** banner stating the reason (*Trespassing incident*).
5. Attempting normal verification is blocked.
6. Click **Security Supervisor Override** to authorize entry; observe that the hit is logged to the security audit trail.

### Scenario E: Admin Operations, Analytics & CSV Export
1. Log in as `admin@suvms.edu` / `Admin@123`.
2. View **Overview**: inspect the 6 summary cards, the daily line chart, and the demographics donut chart.
3. Navigate to **Records**: apply filters, search by keyword, and click **Export to CSV**. Verify the downloaded spreadsheet.
4. Navigate to **Users**: deactivate a user or click **Create Staff Account** to register a new guard.
5. Navigate to **Blacklist**: test the **Instant Verification Tool** with phone `9123456789` (shows red alert) and phone `9999999999` (shows green clear). View the **Audit Hit Logs** tab.
