import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export default function AdminBookings() {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name), drivers(name), profiles:user_id(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").eq("available", true);
      if (error) throw error;
      return data;
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("bookings").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-full"] });
      toast({ title: "Booking updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Bookings</h1>
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell>{b.profiles?.full_name || "Unknown"}</TableCell>
                <TableCell>{b.cars?.name}</TableCell>
                <TableCell className="text-xs">{b.pickup_date} → {b.return_date}</TableCell>
                <TableCell className="font-bold">${Number(b.total_price).toFixed(0)}</TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={(v) => updateBooking.mutate({ id: b.id, updates: { status: v } })}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={b.driver_id || "none"} onValueChange={(v) => updateBooking.mutate({ id: b.id, updates: { driver_id: v === "none" ? null : v } })}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Assign" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Driver</SelectItem>
                      {drivers?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
