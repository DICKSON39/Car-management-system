import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Cars from "./pages/customer/Cars";
import CarDetails from "./pages/customer/CarDetails";
import Bookings from "./pages/customer/Bookings";
import Payment from "./pages/customer/Payment";
import Dashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCars from "./pages/admin/AdminCars";
import AdminDrivers from "./pages/admin/AdminDrivers";
import Revenue from "./pages/admin/Revenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/cars" element={<Cars />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
            </Route>
            <Route element={<ProtectedRoute requiredRole="admin"><AppLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/cars" element={<AdminCars />} />
              <Route path="/admin/drivers" element={<AdminDrivers />} />
              <Route path="/admin/revenue" element={<Revenue />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
