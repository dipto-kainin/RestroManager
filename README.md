# Bistro Restaurant Chain Manager (Frontend)

A premium, modern restaurant management dashboard and booking client built with React 19, TypeScript, and Vite. This app connects directly to the Go + MongoDB backend API.

## Core Portals & Features

1. **Manager & Staff Area**:
   * **Floor Map**: Visual interactive layout showing occupied, reserved, and vacant tables with real-time capacity and seating status.
   * **Order Queue**: A kitchen Kanban board representing order preparation phases (Pending, Preparing, Ready, Served).
   * **Billing Invoices**: Real-time billing system managing payments via multiple methods (Cash, Card, UPI) with direct Razorpay payment verification integration.
   * **Food Menu Management**: Management screen to add or edit dishes and organize catalog items by categories.
2. **Customer Area**:
   * **Book Table**: Multi-step reservation flow enabling users to select party sizes, dates, start times, durations, and table sharing preferences.
   * **My Bookings**: Real-time tracking of active and past table reservations with cancellation capabilities.
   * **Online Menu & Self-Order**: Interactive guest menu where users checked into active tables can add items to their cart, send orders directly to the kitchen queue, and trigger payments.

---

## Demo & Test Accounts

You can use the following pre-registered credentials on the login screen to explore different user access roles (you can modify these later in your MongoDB database):

### 1. Admin Account (Full access to all analytics, maps, and menus)
* **Email**: `admin@bistro.com`
* **Password**: `password`

### 2. Staff Account (Access to floor maps, active kitchen queue, and billing checkout)
* **Email**: `staff@bistro.com`
* **Password**: `password`

### 3. Customer Account (Access to table reservations, digital menus, and order billing)
* **Email**: `customer@bistro.com`
* **Password**: `password`

---

## Tech Stack & Libraries

* **Core**: React 19, TypeScript, Vite
* **Routing**: React Router 7
* **Data Fetching & Cache**: TanStack React Query (v5)
* **Design & Styling**: Custom CSS with OKLCH color spaces, snappy scale-tactile click variables, and Phosphor Icons.
* **Payment Integration**: Razorpay Web Checkout Integration
* **Security & Auth**: JWT authorization parsed on route requests.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `RestroManager` directory:
```env
VITE_API_URL=http://localhost:8080 // or use our backend service
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## Vercel Deployment Configuration
Vercel deployment is configured via the local `vercel.json` file. It automatically enables Clean URLs, removes trailing slashes, and redirects all client routing to `index.html` to prevent 404 errors on browser page reloads:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
