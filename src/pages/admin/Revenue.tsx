import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

export default function Revenue() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["revenue-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").eq("status", "completed");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const totalRevenue = bookings?.reduce((s, b) => s + Number(b.total_price), 0) ?? 0;
  const avgValue = bookings?.length ? totalRevenue / bookings.length : 0;

  const monthlyData: Record<string, number> = {};
  bookings?.forEach((b) => {
    const m = b.pickup_date.substring(0, 7);
    monthlyData[m] = (monthlyData[m] || 0) + Number(b.total_price);
  });
  const chartData = Object.entries(monthlyData).sort().map(([month, revenue]) => ({ month, revenue }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Revenue Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Booking Value</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">${avgValue.toFixed(0)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No completed bookings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
