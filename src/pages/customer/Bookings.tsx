import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Bookings() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalPaid = bookings?.filter((b) => b.payment_status === "paid").reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0;

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Paid:</span>
            <span className="font-bold text-primary">${totalPaid.toFixed(0)}</span>
          </div>
        </Card>
      </div>

      {bookings?.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No bookings yet. Browse cars to get started!</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{(booking as any).cars?.name}</TableCell>
                  <TableCell>{booking.pickup_date}</TableCell>
                  <TableCell>{booking.return_date}</TableCell>
                  <TableCell>{booking.pickup_location}</TableCell>
                  <TableCell className="font-bold">${Number(booking.total_price).toFixed(0)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[booking.status] || ""}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={booking.payment_status === "paid" ? statusColors.completed : statusColors.pending}>
                      {booking.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
