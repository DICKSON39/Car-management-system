import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, ArrowLeft, Users, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickupDate, setPickupDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [pickupLocation, setPickupLocation] = useState("");
  const [withDriver, setWithDriver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: car, isLoading } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const days = pickupDate && returnDate ? Math.max(differenceInDays(returnDate, pickupDate), 1) : 0;
  const totalPrice = days * (car ? Number(car.price_per_day) : 0);

  const handleBook = async () => {
    if (!pickupDate || !returnDate || !pickupLocation.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (returnDate <= pickupDate) {
      toast({ title: "Return date must be after pickup date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("bookings").insert({
      user_id: user!.id,
      car_id: car!.id,
      pickup_date: format(pickupDate, "yyyy-MM-dd"),
      return_date: format(returnDate, "yyyy-MM-dd"),
      pickup_location: pickupLocation.trim(),
      with_driver: withDriver,
      total_price: totalPrice,
    }).select().single();

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      navigate(`/payment/${data.id}`);
    }
    setSubmitting(false);
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (!car) return <p>Car not found.</p>;

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-lg overflow-hidden bg-muted h-80 flex items-center justify-center">
          {car.image_url ? (
            <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
          ) : (
            <Fuel className="h-24 w-24 text-muted-foreground" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{car.name}</h1>
            <Badge variant="secondary" className="capitalize">{car.trip_type.replace("_", " ")}</Badge>
          </div>
          <p className="text-muted-foreground mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> {car.capacity} passengers</p>
          <p className="text-3xl font-bold text-primary mb-4">${Number(car.price_per_day).toFixed(0)} <span className="text-base font-normal text-muted-foreground">/ day</span></p>
          <p className="text-muted-foreground mb-6">{car.description || "No description available."}</p>

          <Card>
            <CardHeader><CardTitle>Book This Car</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pickup Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !pickupDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {pickupDate ? format(pickupDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} disabled={(d) => d < new Date()} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !returnDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(d) => d < (pickupDate || new Date())} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="e.g. Airport Terminal 2" />
              </div>
              <div className="flex items-center justify-between">
                <Label>With Driver</Label>
                <Switch checked={withDriver} onCheckedChange={setWithDriver} />
              </div>
              {days > 0 && (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">{days} day{days > 1 ? "s" : ""} × ${Number(car.price_per_day).toFixed(0)}</p>
                  <p className="text-2xl font-bold text-primary">${totalPrice.toFixed(0)}</p>
                </div>
              )}
              <Button className="w-full" onClick={handleBook} disabled={submitting}>
                {submitting ? "Booking..." : "Book Now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
