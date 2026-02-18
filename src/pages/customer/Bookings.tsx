import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, DollarSign, Star, User, MessageCircle, Info, Download, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Bookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // 1. Fetch Data with joined Profiles and Cars
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars(name),
          drivers(name, phone),
          profiles(full_name, email)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 2. Invoice Download Handler
  const handleDownloadInvoice = async (booking: any) => {
    setIsDownloading(booking.id);
    
    // Calculate days safely
    const start = new Date(booking.pickup_date);
    const end = new Date(booking.return_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          booking_id: booking.id,
          customer_name: booking.profiles?.full_name || "Valued Customer",
          car_name: booking.cars?.name || "Premium Vehicle",
          total_days: diffDays,
          amount: booking.total_price,
          pickup: booking.pickup_date,
          return: booking.return_date
        },
      });

      if (error) throw error;

      if (data?.pdf) {
        const link = document.createElement('a');
        link.href = data.pdf;
        link.download = `Invoice-${booking.id.slice(0, 8)}.pdf`;
        link.click();
        toast({ title: "Success", description: "Invoice downloaded successfully!" });
      }
    } catch (err) {
      console.error("Download error:", err);
      toast({ 
        title: "Download Failed", 
        description: "We couldn't generate your PDF right now.", 
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const submitRating = useMutation({
    mutationFn: async ({ bookingId, rating, reviewText }: { bookingId: string; rating: number; reviewText: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ rating, review_text: reviewText })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({ title: "Feedback Received", description: "Thank you for your review!" });
      setRatingBooking(null);
      setStars(5);
      setComment("");
    },
  });

  const totalPaid = bookings?.filter((b) => b.payment_status === "paid").reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0;
  const activeTrip = bookings?.find(b => b.status === "confirmed");

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header with Total Paid Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Journey</h1>
          <p className="text-muted-foreground">Review your past trips and manage invoices.</p>
        </div>
        <Card className="px-6 py-3 bg-primary/5 border-primary/20 flex items-center gap-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Invested</p>
            <p className="text-xl font-bold text-primary">${totalPaid.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Live Trip Banner */}
      {activeTrip && (
        <Card className="border-primary/50 shadow-md bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4">
                <Badge className="bg-primary animate-pulse">Ongoing Trip</Badge>
                <h2 className="text-2xl font-bold">{(activeTrip as any).cars?.name}</h2>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-4 w-4" /> {(activeTrip as any).drivers?.name}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Due: {activeTrip.return_date}</span>
                </div>
              </div>
              <Button className="gap-2" onClick={() => window.open(`https://wa.me/${(activeTrip as any).drivers?.phone?.replace(/\D/g, '')}`, '_blank')}>
                <MessageSquare className="h-4 w-4" /> Contact Driver
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
        <TooltipProvider>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Rental Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-semibold">{(b as any).cars?.name}</TableCell>
                  <TableCell className="text-xs">
                    {b.pickup_date} <span className="text-muted-foreground mx-1">→</span> {b.return_date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColors[b.status]} border-none font-bold text-[9px]`}>
                      {b.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.payment_status === "paid" ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => handleDownloadInvoice(b)}
                        disabled={isDownloading === b.id}
                      >
                        {isDownloading === b.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <><Download className="h-3 w-3 mr-2" /> PDF</>
                        )}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Unpaid</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === "completed" && !b.rating && (
                      <Button size="sm" variant="secondary" className="h-7 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => setRatingBooking(b)}>
                        <Star className="h-3 w-3 mr-1 fill-current" /> Rate Trip
                      </Button>
                    )}
                    {b.rating && (
                      <div className="flex justify-end items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < b.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                        {b.review_text && (
                          <Tooltip>
                            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p className="max-w-[150px] text-[10px]">{b.review_text}</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      {/* Rating Dialog */}
      <Dialog open={!!ratingBooking} onOpenChange={() => setRatingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Feedback</DialogTitle>
            <DialogDescription>How was your experience with the {ratingBooking?.cars?.name}?</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <Star
                  key={num}
                  className={`h-10 w-10 cursor-pointer transition-all ${num <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  onClick={() => setStars(num)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Comments</label>
              <Textarea 
                placeholder="Driver, car condition..." 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingBooking(null)}>Cancel</Button>
            <Button onClick={() => submitRating.mutate({ bookingId: ratingBooking.id, rating: stars, reviewText: comment })} disabled={submitRating.isPending}>
              {submitRating.isPending ? "Saving..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}