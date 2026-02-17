import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "text-green-600 bg-green-50 border-green-200";
    case "pending": return "text-amber-600 bg-amber-50 border-amber-200";
    case "cancelled": return "text-red-600 bg-red-50 border-red-200";
    case "completed": return "text-blue-600 bg-blue-50 border-blue-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export default function AdminBookings() {
  const queryClient = useQueryClient();

  // Fetch Bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin-bookings-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name, id), drivers(name, id), profiles:user_id(full_name,email,phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch Drivers
  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Combined Mutation for Booking, Car, and Driver status
  const updateBooking = useMutation({
    mutationFn: async ({ 
      id, 
      carId, 
      driverId, 
      updates 
    }: { 
      id: string; 
      carId?: string; 
      driverId?: string; 
      updates: Record<string, any> 
    }) => {
      // 1. Update the booking status
      const { error: bookingError } = await supabase.from("bookings").update(updates).eq("id", id);
      if (bookingError) throw bookingError;

      // 2. Logic for RELEASING resources (Cancelled/Completed)
      if (updates.status === "cancelled" || updates.status === "completed") {
        if (carId) {
          await supabase.from("cars").update({ available: true }).eq("id", carId);
        }
        // Release whichever driver was linked to this booking
        const currentDriver = updates.driver_id || driverId;
        if (currentDriver && currentDriver !== "none") {
          await supabase.from("drivers").update({ available: true }).eq("id", currentDriver);
        }
      }
      
      // 3. Logic for OCCUPYING resources (Confirmed)
      if (updates.status === "confirmed") {
        if (carId) {
          await supabase.from("cars").update({ available: false }).eq("id", carId);
        }
        const targetDriver = updates.driver_id || driverId;
        if (targetDriver && targetDriver !== "none") {
          await supabase.from("drivers").update({ available: false }).eq("id", targetDriver);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-full"] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: "Success", description: "Booking and fleet status updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoadingBookings) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
        {updateBooking.isPending && (
          <div className="flex items-center text-sm text-muted-foreground animate-pulse">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing Fleet...
          </div>
        )}
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Vehicle</TableHead>
              <TableHead className="font-semibold">Rental Period</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Assign Driver</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              bookings?.map((b: any) => (
                <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm">{b.profiles?.full_name}</span>
                      <span className="text-xs text-muted-foreground">{b.profiles?.email}</span>
                      {b.profiles?.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-green-700">{b.profiles.phone}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              const msg = `Hello ${b.profiles.full_name}, about your ${b.cars?.name} booking...`;
                              window.open(`https://wa.me/${b.profiles.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, "_blank");
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{b.cars?.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{b.pickup_date}</div>
                    <div className="text-xs text-muted-foreground">to {b.return_date}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(b.total_price).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Select 
                      disabled={updateBooking.isPending}
                      value={b.status} 
                      onValueChange={(v) => updateBooking.mutate({ 
                        id: b.id, 
                        carId: b.car_id, 
                        driverId: b.driver_id,
                        updates: { status: v } 
                      })}
                    >
                      <SelectTrigger className={`w-[130px] h-8 text-xs font-semibold uppercase tracking-wider ${getStatusColor(b.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select 
                      disabled={updateBooking.isPending}
                      value={b.driver_id || "none"} 
                      onValueChange={(v) => updateBooking.mutate({ 
                        id: b.id, 
                        carId: b.car_id,
                        updates: { driver_id: v === "none" ? null : v } 
                      })}
                    >
                      <SelectTrigger className="w-[160px] h-8 ml-auto">
                        <SelectValue placeholder="Select Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {drivers?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} {!d.available && d.id !== b.driver_id ? "(Busy)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select 
                      disabled={updateBooking.isPending}
                      value={b.payment_status || "pending"} 
                      onValueChange={(v) => updateBooking.mutate({ id: b.id, updates: { payment_status: v } })}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid ✅</SelectItem>
                        <SelectItem value="failed">Failed ❌</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}