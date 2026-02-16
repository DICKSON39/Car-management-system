

# 🚗 Advanced Car Rental Management System

## Overview
A full-featured car rental platform with customer-facing booking and admin management, built with React + Supabase, featuring a sleek dark theme UI.

---

## 1. Authentication & Role System
- **Sign up / Login** pages using Supabase Auth (email + password)
- **User roles** stored in a separate `user_roles` table (customer/admin) with security definer functions
- **Protected routes** — customers and admins see different interfaces
- **Auto-assign** "customer" role on registration; admin role assigned manually via database

---

## 2. Database Schema (Supabase)
- **profiles** — user display info (name, phone), linked to `auth.users`
- **user_roles** — role assignments (customer/admin) with RLS-safe helper function
- **cars** — name, image_url, trip_type (wedding/airport/long_trip), capacity, price_per_day, available, description
- **drivers** — name, phone, license_number, available
- **bookings** — user_id, car_id, driver_id (nullable), pickup_date, return_date, pickup_location, with_driver, total_price, status (pending/confirmed/completed/cancelled), payment_status
- Full **RLS policies**: customers see only their own bookings; admins see everything; only admins can manage cars/drivers

---

## 3. Customer Features

### Car Browse & Search
- Grid/list view of available cars with images
- **Filters**: trip type, capacity, price range, date availability
- Search by car name

### Car Details Page
- Large image display, pricing, capacity, trip category, description
- Availability calendar indicator
- "Book Now" button

### Booking Flow
- Booking form: pickup date, return date, pickup location, with/without driver
- **Double-booking prevention** via database constraints
- Auto-calculated total price (days × price_per_day)
- Booking saved as "pending"

### Fake Payment Page
- Simulated payment screen with card UI
- Two buttons: "Pay Successfully" and "Simulate Failure"
- On success → booking status updated to "confirmed" with toast notification
- On failure → stays "pending" with error toast

### Booking History
- Table/card view of all customer bookings
- Status badges (Pending, Confirmed, Completed, Cancelled)
- Total amount paid summary

---

## 4. Admin Features

### Dashboard Overview
- Stats cards: Total Bookings, Total Revenue, Active Rentals, Pending Bookings
- Monthly revenue chart (Recharts bar/line chart, completed bookings only)

### Booking Management
- Table of all bookings with customer details
- Status change dropdown (Confirmed, Completed, Cancelled)
- Assign driver to booking from available drivers

### Car Management
- CRUD for cars: Add, Edit, Delete
- Toggle car availability
- Image URL input for car photos

### Driver Management
- Add/Edit drivers (name, phone, license number)
- Toggle driver availability
- View driver assignment history

### Revenue Analytics
- Monthly revenue bar chart grouped by month
- Only counts completed bookings
- Summary stats (total revenue, average booking value)

---

## 5. UI & Layout
- **Dark theme** throughout with accent colors for highlights
- **Sidebar navigation** for both customer and admin views
- **Responsive design** — works on desktop and mobile
- **Toast notifications** for all actions (booking, payment, status changes)
- **Loading skeletons** during data fetches
- **Form validation** with clear error messages on all forms

---

## 6. Security
- RLS policies on all tables
- `has_role()` security definer function to prevent RLS recursion
- Customers can only access their own data
- Admin-only operations protected at both UI and database level
- Input validation on all forms

