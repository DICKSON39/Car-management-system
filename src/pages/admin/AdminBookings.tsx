import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  History,
  PlayCircle,
  Trash2,
  RotateCcw,
  DollarSign,
  Phone,
  UserCheck,
  Download,
} from "lucide-react";
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

  // 1. Fetch Bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin-bookings-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name, id), drivers(name, id, phone), profiles:user_id(full_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch Drivers
  const { data: drivers } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) throw error;
      return data;
    },
  });

  // 3. Invoice Generator Helper
  const generateAndSendInvoice = async (booking: any) => {
    if (!booking) return;
    
    const start = new Date(booking.pickup_date);
    const end = new Date(booking.return_date);
    const diffDays = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          booking_id: booking.id,
          customer_name: booking.profiles?.full_name || "Customer",
          car_name: booking.cars?.name || "Vehicle",
          total_days: diffDays,
          amount: booking.total_price
        },
      });

      if (data?.pdf) {
        const link = document.createElement('a');
        link.href = data.pdf;
        link.download = `Invoice_${booking.id.slice(0, 8)}.pdf`;
        link.click();
        toast({ title: "Invoice Ready", description: "Downloading PDF..." });
      }
    } catch (err) {
      console.error("Invoice Error:", err);
    }
  };

  // 4. Update Mutation (PAID -> CONFIRMED Logic)
  const updateBooking = useMutation({
    mutationFn: async ({ id, carId, driverId, updates, fullBookingData }: any) => {
      let finalUpdates = { ...updates };
      
      // LOGIC: If Paid is selected, set Trip to Confirmed
      if (updates.payment_status === "paid") {
        finalUpdates.status = "confirmed";
      }

      const { error: bookingError } = await supabase
        .from("bookings")
        .update(finalUpdates)
        .eq("id", id);
      if (bookingError) throw bookingError;

      // Trigger Invoice only if payment is marked as paid
      if (finalUpdates.payment_status === "paid") {
        await generateAndSendInvoice(fullBookingData);
      }

      // Handle Resource Availability
      const isFinishing = finalUpdates.status === "cancelled" || finalUpdates.status === "completed";
      const isStarting = finalUpdates.status === "confirmed";

      if (isFinishing) {
        if (carId) await supabase.from("cars").update({ available: true }).eq("id", carId);
        if (driverId) await supabase.from("drivers").update({ available: true }).eq("id", driverId);
      } else if (isStarting) {
        if (carId) await supabase.from("cars").update({ available: false }).eq("id", carId);
        if (driverId) await supabase.from("drivers").update({ available: false }).eq("id", driverId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-full"] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      toast({ title: "Updated", description: "Payment status and trip status synced." });
    },
  });

  const notifyDriver = (booking: any) => {
    const driver = drivers?.find((d) => d.id === booking.driver_id);
    if (!driver?.phone) return toast({ title: "Error", description: "No driver phone" });
    const msg = `*TRIP ASSIGNED*%0A🚗 *Car:* ${booking.cars?.name}%0A👤 *Customer:* ${booking.profiles?.full_name}`;
    window.open(`https://wa.me/${driver.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const deleteBooking = useMutation({
    mutationFn: async (b: any) => await supabase.from("bookings").delete().eq("id", b.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-bookings-full"] }),
  });

  const activeBookings = bookings?.filter((b) => b.status !== "completed" && b.status !== "cancelled") || [];
  const historyBookings = bookings?.filter((b) => b.status === "completed" || b.status === "cancelled") || [];
  const totalRevenue = historyBookings.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);

  if (isLoadingBookings) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  const renderTable = (data: any[], isHistory: boolean) => (
    <div className="rounded-md border bg-card shadow-sm mt-4">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            {!isHistory && <TableHead className="text-right">Driver</TableHead>}
            <TableHead className="text-right">{isHistory ? "Actions" : "Payment"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((b) => (
            <TableRow key={b.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{b.profiles?.full_name}</span>
                  <span className="text-[11px] text-muted-foreground">{b.profiles?.phone}</span>
                </div>
              </TableCell>
              <TableCell className="text-[11px]">{b.cars?.name}</TableCell>
              <TableCell className="text-[11px] font-mono">{b.pickup_date}</TableCell>
              <TableCell>
                <Select
                  value={b.status}
                  onValueChange={(v) => updateBooking.mutate({
                    id: b.id, carId: b.car_id, driverId: b.driver_id, updates: { status: v }, fullBookingData: b
                  })}
                >
                  <SelectTrigger className={`w-[110px] h-7 text-[10px] font-bold uppercase ${getStatusColor(b.status)}`}>
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
                  <div className="flex flex-col items-end gap-1">
                    <Select
                      value={b.driver_id || "none"}
                      onValueChange={(v) => updateBooking.mutate({
                        id: b.id, carId: b.car_id, updates: { driver_id: v === "none" ? null : v }, fullBookingData: b
                      })}
                    >
                      <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {drivers?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-6 text-[9px] text-blue-600" onClick={() => notifyDriver(b)}>Notify Driver</Button>
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right">
                {isHistory ? (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => generateAndSendInvoice(b)}><Download className="h-3 w-3 mr-1" /> PDF</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(b)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <Select
                    value={b.payment_status || "pending"}
                    onValueChange={(v) => updateBooking.mutate({
                      id: b.id, updates: { payment_status: v }, fullBookingData: b
                    })}
                  >
                    <SelectTrigger className="w-[90px] h-7 text-xs ml-auto"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid ✅</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Fleet Control</h1>
        <Card className="px-6 py-3 bg-green-50 flex items-center gap-4">
         
          <div>
            <p className="text-[10px] uppercase font-bold text-green-600">Total Revenue</p>
            <p className="text-2xl font-black text-black">ksh: {totalRevenue.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="active">{renderTable(activeBookings, false)}</TabsContent>
        <TabsContent value="history">{renderTable(historyBookings, true)}</TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Delete?</AlertDialogTitle>
            <AlertDialogDescription>Remove booking for {deleteId?.profiles?.full_name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => deleteBooking.mutate(deleteId)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}