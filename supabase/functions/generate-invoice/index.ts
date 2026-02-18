import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { booking_id, customer_name, car_name, total_days, amount } = payload

    // 1. Create PDF
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.setTextColor(0, 0, 0)
    doc.text("ELITE CAR RENTALS", 20, 20)
    
    // Aesthetic Line
    doc.setLineWidth(0.5)
    doc.line(20, 25, 190, 25) 

    // Invoice Details
    doc.setFontSize(12)
    doc.text(`Invoice ID: ${booking_id?.slice(0, 8) || 'N/A'}`, 20, 35)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42)

    // Customer & Vehicle Info
    doc.setFont("helvetica", "bold")
    doc.text("BILL TO:", 20, 55)
    doc.setFont("helvetica", "normal")
    doc.text(`${customer_name || 'Valued Customer'}`, 20, 62)

    // Booking Details Table-like structure
    doc.setFont("helvetica", "bold")
    doc.text("Description", 20, 80)
    doc.text("Details", 100, 80)
    doc.line(20, 82, 190, 82)

    doc.setFont("helvetica", "normal")
    doc.text("Vehicle Name", 20, 90)
    doc.text(`${car_name || 'Vehicle'}`, 100, 90)

    doc.text("Rental Duration", 20, 100)
    // Fallback to 1 if total_days is undefined or 0
    doc.text(`${total_days || 1} Day(s)`, 100, 100)

    doc.setFont("helvetica", "bold")
    doc.text("Total Paid", 20, 115)
    doc.setTextColor(16, 185, 129) // Success Green color
    doc.text(`$${Number(amount || 0).toLocaleString()}`, 100, 115)

    // Footer / Status
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text("Payment Status: PAID", 20, 140)
    doc.text("Thank you for choosing Elite Car Rentals!", 20, 150)

    // 2. Convert to Base64
    const pdfBase64 = doc.output('datauristring')

    return new Response(JSON.stringify({ pdf: pdfBase64 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("PDF Gen Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})