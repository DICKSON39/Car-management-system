import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name, image_url)")
        .eq("id", bookingId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handlePayment = async (success: boolean) => {
    setProcessing(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_status: success ? "paid" : "failed",
        status: success ? "confirmed" : "pending",
      })
      .eq("id", bookingId!);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (success) {
      toast({ title: "Payment Successful!", description: "Your booking has been confirmed." });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/bookings");
    } else {
      toast({ title: "Payment Failed", description: "Your booking remains pending.", variant: "destructive" });
      navigate("/bookings");
    }
    setProcessing(false);
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (!booking) return <p>Booking not found.</p>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>Car: {(booking as any).cars?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pickup</span>
              <span>{booking.pickup_date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Return</span>
              <span>{booking.return_date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Location</span>
              <span>{booking.pickup_location}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">${Number(booking.total_price).toFixed(0)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium text-center text-muted-foreground">Simulated Payment</p>
            <div className="h-10 rounded bg-muted animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded bg-muted animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handlePayment(true)} disabled={processing} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Pay Successfully
            </Button>
            <Button variant="destructive" onClick={() => handlePayment(false)} disabled={processing} className="gap-2">
              <XCircle className="h-4 w-4" /> Simulate Failure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
