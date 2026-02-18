🚗 Rent Wheels - Full Stack Booking SystemA modern, streamlined car rental platform built with React, Supabase, and Tailwind CSS. This system features a real-time booking engine, administrative dashboard, and a unique "Direct-to-WhatsApp" payment verification flow.🌟 Key Features🏁 Customer ExperienceDynamic Car Gallery: Browse available vehicles with real-time filtering by trip type (Wedding, Airport, Long Trip).Interactive Booking: Seamless date and location selection for car rentals.Profile Management: Automated profile creation with phone number persistence.WhatsApp Integration: Instead of complex payment gateways, customers are redirected to WhatsApp with pre-filled booking details to finalize payments with the admin.🛠 Administrative ToolsInventory Management: Full CRUD (Create, Read, Update, Delete) for the car fleet.Instant Image Uploads: Integrated Supabase Storage for car photos—no more manual URL links.Booking Dashboard: Centralized view of all requests with customer contact details (Email & Phone) and one-click WhatsApp chat buttons.Status Control: Update booking and payment statuses (Pending, Paid, Completed) in real-time.💻 Tech StackLayerTechnologyFrontendReact (Vite), TypeScript, Tailwind CSSState ManagementTanStack Query (React Query)Database & AuthSupabase (PostgreSQL)File StorageSupabase Storage (Buckets)UI ComponentsRadix UI / Shadcn UI🚀 Database & Storage SetupTo get this project running, the following configurations are required in your Supabase project:1. Database TablesThe system relies on three core tables:profiles: Stores user contact info (ID, full_name, email, phone).cars: Stores vehicle details (name, capacity, price_per_day, image_url, etc.).bookings: Links users to cars with specific dates and status.2. SQL TriggersTo ensure every sign-up creates a profile automatically, use this trigger:SQLCREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
3. Storage BucketCreate a public bucket named car-images.Apply RLS Policies to allow INSERT and SELECT for authenticated users so car photos can be uploaded via the Admin panel.








🛠 Installation & Local Development
Clone the repo:

Bash
git clone https://github.com/DICKSON39/Car-management-system.git
Install dependencies:

Bash
npm install
Set up Environment Variables:
Create a .env file and add your Supabase credentials:

Code snippet
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Start the app:

Bash
npm run dev
📞 Business Logic: Why WhatsApp?
This project uses a hybrid-manual payment flow. By redirecting users to WhatsApp:

Trust: Customers speak to a real person before paying.

Flexibility: Admins can accept various payment methods (M-Pesa, Bank Transfer, Cash) without integrating expensive third-party APIs.

Speed: The "One-Click Chat" button in the Admin panel allows for instant customer support.


📈 Business Intelligence & Growth
Global Configuration & Scalability

Centralized Admin Settings: Manage site-wide branding (Site Name, Support Email, Phone) and global currency symbols from a single database-backed dashboard.

Maintenance Mode: A one-click "Kill Switch" in the Admin panel that gracefully overlays a branded maintenance screen for users during fleet updates.

Live Business Stats: The landing page features a real-time "Trust Bar" that dynamically counts active users and total cars directly from the PostgreSQL database using Supabase head counts.

Inquiry Inbox: A dedicated lead management system that captures potential customer questions from the landing page, allowing admins to convert "browsers" into "renters."

🔒 Enhanced Security (RLS)
The system implements a strict Row Level Security hierarchy to balance public marketing with private data:

Public (Anon): Can view the fleet, public reviews, and site settings.

Authenticated (Customer): Can manage their own bookings and profile.

Admin: Full bypass for fleet management, settings control, and viewing all customer inquiries.

🛠 Revised Database Schema
To support the latest features, the project now includes:

admin_settings: A singleton table for global app state.

contact_inquiries: A dedicated lead-capture table.

Public Policies: Fine-tuned SQL policies to allow guest access to specific car data and testimonials.

🚀 Getting Started with Settings
Initialize Settings: Run the provided SQL to create the admin_settings table.

Configure Branding: Access the /admin/settings route to set your business name and contact details.

Go Live: Your landing page will automatically pull these details and reflect the "Real" number of cars you have in your database.