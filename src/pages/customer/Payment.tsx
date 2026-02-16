import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle, Phone, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [phone, setPhone] = useState("");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name, image_url), profiles:user_id(phone)")
        .eq("id", bookingId!)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (booking?.profiles?.phone) {
      setPhone(booking.profiles.phone);
    }
  }, [booking]);

  const handleWhatsAppRedirect = (bId: string, totalPrice: number, carName: string) => {
    // ⚠️ Replace with your actual business phone number (International format, no +)
    const adminPhone = "254712821098"; 
    const shortId = bId.split('-')[0].toUpperCase();
    const message = `Hello! I've requested a booking.%0A%0A*Car:* ${carName}%0A*Booking ID:* ${shortId}%0A*Total:* $${totalPrice}%0A*Contact:* ${phone}%0A%0APlease provide payment instructions.`;
    
    window.open(`https://wa.me/${adminPhone}?text=${message}`, "_blank");
  };

  const handleSubmitForReview = async () => {
    if (!phone || phone.length < 10) {
      toast({ 
        title: "Invalid Phone", 
        description: "Please enter a valid contact number.", 
        variant: "destructive" 
      });
      return;
    }

    setProcessing(true);
    
    try {
      // 1. Update the user's profile phone number
      await supabase
        .from("profiles")
        .update({ phone: phone })
        .eq("id", booking?.user_id);

      // 2. Update booking status to pending
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          payment_status: "pending", 
          status: "pending",         
        })
        .eq("id", bookingId!);

      if (bookingError) throw bookingError;

      toast({ 
        title: "Booking Submitted!", 
        description: "Opening WhatsApp to finalize your booking..." 
      });

      // 3. Trigger WhatsApp Redirect
      handleWhatsAppRedirect(
        bookingId!, 
        Number(booking.total_price), 
        (booking as any).cars?.name || "Car"
      );

      // 4. Cleanup and move user to their list
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/bookings");

    } catch (error: any) {
      toast({ 
        title: "Submission Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <div className="max-w-md mx-auto mt-20"><Skeleton className="h-[500px] w-full" /></div>;
  if (!booking) return <div className="text-center p-20">Booking not found.</div>;

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 bg-slate-50/50">
      <Card className="w-full max-w-md border-t-4 border-t-primary shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Confirm Booking</CardTitle>
          <CardDescription>Review your details and contact us</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contact Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Contact Phone Number
            </label>
            <Input 
              type="tel" 
              placeholder="e.g. 0712345678" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-lg py-5"
            />
          </div>

          {/* Booking Summary Card */}
          <div className="rounded-xl bg-slate-100 p-5 space-y-3 border border-slate-200">
             <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-bold">{(booking as any).cars?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pickup</span>
              <span className="font-medium">{booking.pickup_date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{booking.pickup_location}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-300 flex justify-between items-baseline">
              <span className="font-bold text-slate-700">Total Price</span>
              <span className="text-2xl font-black text-primary">${Number(booking.total_price).toFixed(0)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitForReview} 
            disabled={processing} 
            className="w-full h-14 text-lg font-bold gap-3 shadow-lg hover:shadow-primary/20"
          >
            {processing ? (
              "Saving..."
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                Confirm & Chat on WhatsApp
              </>
            )}
          </Button>
          
          <p className="text-center text-[11px] text-muted-foreground px-4">
            By clicking above, your booking will be saved and you will be redirected to WhatsApp to receive payment instructions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}