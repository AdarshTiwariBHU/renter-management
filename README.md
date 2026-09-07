# 🏢 Greenwood Residency — Complete Renter & Tenant Management System

A production-ready full-stack web application for property owners and managers to efficiently manage renters, rooms, monthly rent, multi-meter electricity consumption, billing invoices, partial payments, double-entry accounting ledgers, identity documents, and business analytics.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB Atlas / Mongoose ODM**, and **Recharts**.

---

## 🚀 Key Features

1. **⚡ Fast Monthly Meter Update Workflow**
   - Direct global modal accessible anywhere in 1-click.
   - Automatically retrieves previous reading.
   - Live real-time calculations:
     $$\text{Units Consumed} = \text{Current Reading} - \text{Previous Reading}$$
     $$\text{Electricity Amount} = \text{Units Consumed} \times \text{Rate Per Unit}$$
   - Prevents $\text{Current Reading} < \text{Previous Reading}$.
   - Immediately recalculates and synchronizes the current month's bill and dashboard.

2. **🔌 Multiple Meters per Renter**
   - Renters can have multiple independent meters (e.g. *Room Meter*, *AC Meter*, *Kitchen Meter*).
   - Each meter maintains its own starting reading, historical readings, and customized rate per unit.
   - Monthly bills generate line-item breakdowns per meter.

3. **💳 Partial Payments & Financial Ledger**
   - Full support for partial payments (e.g. ₹4,000 paid against a ₹6,600 bill leaves ₹2,600 remaining balance).
   - Immutable double-entry transaction ledger tracking all debits (bills) and credits (payments) with exact running balance.
   - Payment status logic: `PAID`, `PARTIALLY_PAID`, `PENDING`, `OVERDUE`.

4. **⏰ Automated Overdue Tracking**
   - Automatically computes days overdue against tenant's assigned rent due day (default: 5th).
   - Overdue badges dynamically display `Xd Overdue` and reset to 0 once cleared.

5. **🧾 Printable & Downloadable Receipts**
   - Professional receipts with property header, breakdown of rent, electricity, arrears, payment mode, reference ID, and authorized signature.
   - Clean `@media print` CSS styling for 1-click print or browser PDF download.

6. **🔒 Document Management & Aadhaar Privacy**
   - Upload tenant photos, Aadhaar front & back images, and ID proofs.
   - Automatically masks Aadhaar numbers (`XXXX-XXXX-1234`) in normal UI displays to protect tenant privacy.
   - Hybrid file storage adapter: zero-config local storage (`/public/uploads`) with auto-routing to Cloudinary when credentials are provided.

7. **🚪 Safe Renter Vacation & Final Settlement**
   - Mark as Vacated workflow with final meter readings, final rent, deductions for cleaning/damages, and security deposit refund calculation.
   - Releases the room for new tenants while permanently preserving all past bills, payments, and meter histories.

8. **📊 Business Reports & CSV Export**
   - Monthly Collection report (Billed vs Collected vs Arrears).
   - Electricity Usage report (Top consumers, units consumed, costs).
   - Pending & Overdue Rent report.
   - Room & Unit Occupancy report.
   - 1-Click CSV export.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend / API**: Next.js App Router Route Handlers (`src/app/api/`)
- **Database**: MongoDB Atlas / Local MongoDB, Mongoose 8 ODM
- **Authentication**: JWT in HTTP-only cookies, Bcrypt password hashing, Next.js Middleware route protection
- **File Storage**: Local public uploads + Cloudinary Storage Adapter

---

## 📁 Project Architecture & Directory Structure

```
renters-management/
├── public/
│   └── uploads/                  # Uploaded renter photos & verification documents
├── scripts/
│   └── seed.ts                   # Database population script (Admin, 12 Rooms, 10 Renters, 3 Months History)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/            # Administrator login page
│   │   ├── api/
│   │   │   ├── auth/             # Login, Logout, Session Me, Change Password
│   │   │   ├── dashboard/        # Summary KPI aggregation endpoint
│   │   │   ├── renters/          # Renter CRUD, Vacate settlement
│   │   │   ├── rooms/            # Room inventory CRUD & occupancy
│   │   │   ├── meters/           # Multi-meter endpoints
│   │   │   ├── meter-readings/   # Meter reading recording & bill sync
│   │   │   ├── bills/            # Monthly bills listing & batch generator
│   │   │   ├── payments/         # Payment recording & ledger sync
│   │   │   ├── transactions/     # Double-entry ledger queries
│   │   │   ├── reports/          # Analytics & CSV data endpoints
│   │   │   ├── properties/       # Property settings
│   │   │   └── upload/           # Multipart file upload endpoint
│   │   ├── dashboard/            # Executive overview with 8 KPI cards & quick actions
│   │   ├── renters/              # Renters directory, new enrollment, profile tabs, edit
│   │   ├── rooms/                # Rooms management grid
│   │   ├── electricity/          # Month-wise electricity tracking & sorting
│   │   ├── bills/                # Monthly rent & utility billing list
│   │   ├── payments/             # Payments collection history
│   │   ├── transactions/         # Complete financial ledger
│   │   ├── reports/              # 4 Comprehensive reports with CSV export
│   │   ├── settings/             # Property profile, rate defaults, password change
│   │   ├── globals.css           # Tailwind base styles and print styles
│   │   └── layout.tsx            # Global HTML shell
│   ├── components/
│   │   ├── layout/               # AppLayout, Sidebar, TopBar
│   │   ├── modals/               # QuickMeterModal, RecordPaymentModal, ReceiptModal, VacateModal
│   │   └── ui/                   # StatusBadge, styled primitives
│   ├── lib/
│   │   ├── auth.ts               # JWT creation, cookie extraction, password hashing
│   │   ├── calculations.ts       # Electricity formulas, billing status, currency & date helpers
│   │   ├── db.ts                 # Cached Mongoose connection helper
│   │   └── storage.ts            # File storage adapter (local + Cloudinary)
│   ├── models/                   # Mongoose schemas: User, Property, Room, Renter, Meter, MeterReading, Bill, Payment, Transaction, AuditLog
│   ├── types/                    # TypeScript data definitions
│   └── middleware.ts             # Route guard protecting dashboard and admin APIs
├── .env.example
├── .env.local
└── package.json
```

---

## ⚙️ Setup & Local Development

### 1. Prerequisites
- **Node.js**: v18 or higher (v22 tested and verified)
- **MongoDB**: Either local MongoDB server running on port 27017 or a free MongoDB Atlas connection string.

### 2. Clone & Install Dependencies
```bash
cd "d:\renters  management"
npm install
```

### 3. Environment Variables
Create `.env.local` (or copy from `.env.example`):
```env
# MongoDB Connection (MongoDB Atlas or Local MongoDB)
# For Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/renters_management?retryWrites=true&w=majority
# For Local:
MONGODB_URI=mongodb://127.0.0.1:27017/renters_management

# Authentication Secret (32+ characters)
AUTH_SECRET=super_secret_jwt_and_session_token_key_change_in_production_32char

# Next App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Cloudinary Configuration (Omit to store files locally in /public/uploads/)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Populate Database Seed Data
Run the development seed script to immediately populate the database:
```bash
npm run seed
```
This automatically sets up:
- **1 Admin user**: `admin@renters.com` / `admin123`
- **1 Property**: Greenwood Residency
- **12 Rooms**: Floors 1, 2, 3
- **10 Sample Renters**: With photos, Aadhaar details, and multiple meters (Room, AC, Geyser)
- **3 Months of History**: July, August, September 2026 with meter readings, generated bills, partial payments, and overdue examples.

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Administrator Credentials

| Email / Username | Password | Role |
| :--- | :--- | :--- |
| `admin@renters.com` or `admin` | `admin123` | Property Admin |

*(Click the "Fill Demo Admin" button on `/login` to auto-fill credentials in development mode)*

---

## ☁️ MongoDB Atlas Setup Guide

To switch from local MongoDB to MongoDB Atlas in production:
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free M0 cluster.
2. In **Database Access**, create a database user (e.g. `renter_admin`) with password.
3. In **Network Access**, add your server IP or `0.0.0.0/0` (allow access from anywhere).
4. Click **Connect** → **Drivers** (Node.js) and copy the connection string:
   ```
   mongodb+srv://renter_admin:<password>@cluster0.mongodb.net/renters_management?retryWrites=true&w=majority
   ```
5. Paste this connection string into `MONGODB_URI` in `.env.local` or your production hosting environment.
6. Run `npm run seed` to initialize your Atlas database.

---

## 🚀 Production Build & Deployment

To test and build the production bundle:
```bash
npm run build
npm run start
```
The application is ready to be deployed to **Vercel**, **Render**, **Railway**, or any Node.js VPS server.
