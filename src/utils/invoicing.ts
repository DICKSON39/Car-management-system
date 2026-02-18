import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const generateAndSendInvoice = async (booking: any) => {
  // 1. Calculate the duration safely
  // Ensure we have dates, fallback to 1 day if something is wrong
  const pickupDate = new Date(booking.pickup_date);
  const returnDate = new Date(booking.return_date);
  
  const diffTime = Math.abs(returnDate.getTime() - pickupDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  // 2. Extract names safely (handling potential nesting from join queries)
  const customerName = booking.profiles?.full_name || "Customer";
  const carName = booking.cars?.name || "Vehicle";

  try {
    const { data, error } = await supabase.functions.invoke('generate-invoice', {
      body: { 
        booking_id: booking.id,
        customer_name: customerName,
        car_name: carName,
        total_days: diffDays, // Now defined and sent!
        amount: booking.total_price,
        pickup: booking.pickup_date,
        return: booking.return_date
      },
    });

    if (error) throw error;

    if (data?.pdf) {
      // 3. Trigger the download
      const link = document.createElement('a');
      link.href = data.pdf;
      link.download = `Invoice_${booking.id.slice(0, 8)}.pdf`;
      link.click();
      
      toast({ 
        title: "Success", 
        description: "Invoice downloaded successfully!" 
      });
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("Invoice generation error:", err);
    toast({ 
      title: "Error", 
      description: "Failed to generate invoice. Please try again.",
      variant: "destructive" 
    });
    return { data: null, error: err };
  }
};