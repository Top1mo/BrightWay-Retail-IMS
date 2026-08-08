# 🛒 BrightWay Retail Group — Sales & Inventory Management System (V1)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

A modern, centralized web application built for **BrightWay Retail Group** to replace legacy spreadsheets across 6 operational branches and Head Office with a single, real-time source of truth.

---

## 🌟 Executive Summary

Prior to this system, BrightWay Retail Group operated using disconnected spreadsheets, messaging apps, and phone calls. This led to out-of-sync branch inventories, delayed financial reporting, and unrecorded stock movements.

**Version 1 (V1)** solves these core operational bottlenecks by providing:
- **Single Source of Truth**: All 6 branches connect directly to a central cloud database.
- **Atomic Transactions**: Sales checkouts and inter-branch transfers execute inside isolated Prisma transactions to guarantee zero stock overselling and zero race conditions.
- **Same-Day Reporting**: Company-wide sales figures and low-stock alerts update instantly upon point of transaction.

---

## ✨ Core Features & Modules

### ⚡ 1. Point of Sale (POS) Cashier Checkout
- High-speed product catalog grid with instant search and category filter.
- Cart drawer with line-item quantity controls and discount calculation.
- Payment method support (**Cash** & **Card**) with optional customer details capture.
- **Printable Thermal Receipt Modal**: Formatted specifically for standard 80mm thermal receipt printers.

### 📦 2. Accountable Inter-Branch Stock Transfers
- 2-Step Transfer Lifecycle (`PENDING` → `COMPLETED` / `CANCELLED`) for explicit accountability.
- **Atomic Stock Sync**: Completing a transfer atomically decrements sending branch stock and increments receiving branch stock in a single transaction.

### 🔔 3. Real-Time Branch Inventory & Low-Stock Alerts
- Live stock telemetry per product across all operational branches.
- **Configurable Low-Stock Thresholds**: Custom safety thresholds configurable per product per branch in `BranchInventory`.
- Visual alert badges for critical inventory warnings.

### 🚚 4. Supplier Purchase Orders & Goods Receiving
- Supplier directory management (company details, contact person, phone).
- Purchase Order lifecycle tracking (`OPEN`, `PARTIAL`, `FULFILLED`).
- **Goods Receiving Modal**: Log incoming vendor shipments directly into store inventory with automatic stock increments.

### 🔐 5. 7-Role RBAC & 1-Click Persona Switcher
Strict middleware permission boundaries enforced across 7 distinct roles:
1. `SYS_ADMIN` — Full company-wide administrative access.
2. `OPS_DIRECTOR` — Read-only operational oversight of company-wide reports & inventory.
3. `PURCHASING` — Supplier directory and Purchase Order lifecycle management.
4. `BRANCH_MANAGER` — Local branch inventory, transfer initiation/approval, and sales.
5. `INVENTORY_STAFF` — Local stock count adjustments, incoming transfers, and PO goods receipt.
6. `CASHIER` — High-speed POS cashier interface and printable receipts.
7. `FINANCE` — Read-only audit of sales revenue and purchasing records.

> 💡 **Demo Feature**: A header dropdown allows instant 1-click persona switching across all 7 roles for seamless testing.

### 📊 6. Executive & Branch Audit Reports
- Daily Sales Summary per branch table (transaction count, discounts allowed, total revenue).
- Company-wide Low-Stock Product Report.
- **1-Click CSV Data Export** and clean print-view layout.

---

## 📐 Technical Architecture

```
brightway-retail/
├── prisma/
│   ├── schema.prisma             # Full Prisma data model (6 branches, 7 roles, atomic models)
│   └── seed.js                   # Seed script populating branches, users, products, suppliers
├── src/
│   ├── app/
│   │   ├── api/                  # Route Handlers (Auth, POS, Inventory, Transfers, POs, Reports)
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/        # Main telemetry & metrics overview
│   │   │   ├── pos/              # High-speed cashier checkout + thermal receipt
│   │   │   ├── inventory/        # Branch stock levels & threshold editor
│   │   │   ├── transfers/        # Inter-branch stock transfer queue
│   │   │   ├── products/         # Product catalog & soft-delete manager
│   │   │   ├── purchasing/       # Suppliers directory & PO goods receiving
│   │   │   ├── employees/        # User & branch staff directory
│   │   │   └── reports/          # Executive sales summary & CSV exporter
│   ├── lib/
│   │   ├── db.ts                 # Prisma Client singleton
│   │   ├── auth.ts               # RBAC matrix helpers & session metadata
│   │   └── export.ts             # CSV data export utility
│   └── components/
│       └── layout/               # Header (1-click role switcher) & Sidebar
```

---

## 🛠️ Tech Stack & Design Rationale

- **Framework**: Next.js 14 (App Router, Server Actions & Route Handlers)
- **Language**: TypeScript (Strict type safety)
- **Styling**: Tailwind CSS (Clean modern minimalist white UI)
- **Icons**: Lucide React
- **Database & ORM**: Prisma ORM with SQLite (Zero-config local setup with `$transaction` guarantees)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Top1mo/BrightWay-Retail-IMS.git
   cd BrightWay-Retail-IMS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Database & Seed Data**:
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🧪 Sample Pre-Seeded Accounts for Persona Testing

You can use the top-right header dropdown to switch between these roles instantly:

| Role | Name | Email | Assigned Branch | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **SYS_ADMIN** | Alice Morgan | `admin@brightway.com` | Head Office | All Modules (Full) |
| **OPS_DIRECTOR** | David Sterling | `director@brightway.com` | Head Office | Company-wide Read-Only |
| **PURCHASING** | Pamela Vance | `purchasing@brightway.com` | Head Office | Suppliers & Purchase Orders |
| **BRANCH_MANAGER**| Mark Gable | `manager.downtown@brightway.com` | Downtown Flagship | Local Inventory & Transfers |
| **INVENTORY_STAFF**| Ian Wright | `inventory.downtown@brightway.com` | Downtown Flagship | Stock Adjustments & Receiving |
| **CASHIER** | Chloe Adams | `cashier.downtown@brightway.com` | Downtown Flagship | High-Speed POS Checkout |
| **FINANCE** | Fiona Gallagher | `finance@brightway.com` | Head Office | Sales & Purchase Audit |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
