import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, History, PlayCircle, Trash2, RotateCcw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [deleteId, setDeleteId] = useState<any>(null);

  // 1. Fetch All Bookings
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

  // 2. Fetch Drivers for the assignment dropdown
  const { data: drivers } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) throw error;
      return data;
    },
  });

  // 3. Mutation: Handles Status Changes & Resource (Car/Driver) Availability
  const updateBooking = useMutation({
    mutationFn: async ({ id, carId, driverId, updates }: any) => {
      // Step A: Update the booking status in DB
      const { error: bookingError } = await supabase.from("bookings").update(updates).eq("id", id);
      if (bookingError) throw bookingError;

      // Step B: If status becomes Completed or Cancelled -> Make assets Available
      if (updates.status === "cancelled" || updates.status === "completed") {
        if (carId) await supabase.from("cars").update({ available: true }).eq("id", carId);
        const dId = updates.driver_id || driverId;
        if (dId && dId !== "none") await supabase.from("drivers").update({ available: true }).eq("id", dId);
      }
      
      // Step C: If status becomes Confirmed (or Re-opened) -> Make assets Busy
      if (updates.status === "confirmed") {
        if (carId) await supabase.from("cars").update({ available: false }).eq("id", carId);
        const dId = updates.driver_id || driverId;
        if (dId && dId !== "none") await supabase.from("drivers").update({ available: false }).eq("id", dId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-full"] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      toast({ title: "Success", description: "Database and fleet status synced." });
    },
  });

  // 4. Mutation: Permanent Delete (Triggered only from History)
  const deleteBooking = useMutation({
    mutationFn: async (b: any) => {
      const { error } = await supabase.from("bookings").delete().eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-full"] });
      toast({ title: "Deleted", description: "Record permanently removed from database." });
    }
  });

  if (isLoadingBookings) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  // Split data for the UI Tabs
  const activeBookings = bookings?.filter(b => b.status !== "completed" && b.status !== "cancelled") || [];
  const historyBookings = bookings?.filter(b => b.status === "completed" || b.status === "cancelled") || [];
  const totalRevenue = historyBookings.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);

  const renderTable = (data: any[], isHistory: boolean) => (
    <div className="rounded-md border bg-card shadow-sm mt-4">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Rental Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            {!isHistory && <TableHead className="text-right">Driver Assignment</TableHead>}
            <TableHead className="text-right">{isHistory ? "Actions" : "Payment"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No bookings found in this section.</TableCell></TableRow>
          ) : (
            data.map((b) => (
              <TableRow key={b.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{b.profiles?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{b.profiles?.phone}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-xs">{b.cars?.name}</TableCell>
                <TableCell className="text-xs">
                  {b.pickup_date} <br/> <span className="text-muted-foreground">to {b.return_date}</span>
                </TableCell>
                <TableCell className="font-bold">${b.total_price}</TableCell>
                <TableCell>
                  <Select 
                    disabled={updateBooking.isPending}
                    value={b.status} 
                    onValueChange={(v) => updateBooking.mutate({ id: b.id, carId: b.car_id, driverId: b.driver_id, updates: { status: v } })}
                  >
                    <SelectTrigger className={`w-[120px] h-7 text-[10px] font-bold uppercase ${getStatusColor(b.status)}`}>
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
                {!isHistory && (
                  <TableCell className="text-right">
                    <Select 
                      value={b.driver_id || "none"} 
                      onValueChange={(v) => updateBooking.mutate({ id: b.id, carId: b.car_id, updates: { driver_id: v === "none" ? null : v } })}
                    >
                      <SelectTrigger className="w-[140px] h-7 ml-auto text-xs">
                        <SelectValue placeholder="Assign Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {drivers?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name} {!d.available ? "(Busy)" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {isHistory ? (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateBooking.mutate({ id: b.id, carId: b.car_id, driverId: b.driver_id, updates: { status: "confirmed" } })}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Re-open
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => setDeleteId(b)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select value={b.payment_status || "pending"} onValueChange={(v) => updateBooking.mutate({ id: b.id, updates: { payment_status: v } })}>
                      <SelectTrigger className="w-[100px] h-7 text-xs ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid ✅</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
        <Card className="px-4 py-2 bg-primary/5 border-primary/20 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full"><DollarSign className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Revenue</p>
            <p className="text-xl font-black">${totalRevenue.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="gap-2"><PlayCircle className="h-4 w-4" /> Active ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> History ({historyBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">{renderTable(activeBookings, false)}</TabsContent>
        <TabsContent value="history">{renderTable(historyBookings, true)}</TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the booking record for <strong>{deleteId?.profiles?.full_name}</strong> from the database. 
              Use this only for cleaning up old data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => deleteBooking.mutate(deleteId)}>Confirm Permanent Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}