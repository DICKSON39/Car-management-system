import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarDays, DollarSign, Car, Clock } from "lucide-react";

export default function Dashboard() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const total = bookings?.length ?? 0;
  const revenue = bookings?.filter((b) => b.status === "completed").reduce((s, b) => s + Number(b.total_price), 0) ?? 0;
  const active = bookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const pending = bookings?.filter((b) => b.status === "pending").length ?? 0;

  const monthlyData: Record<string, number> = {};
  bookings?.filter((b) => b.status === "completed").forEach((b) => {
    const m = b.pickup_date.substring(0, 7);
    monthlyData[m] = (monthlyData[m] || 0) + Number(b.total_price);
  });
  const chartData = Object.entries(monthlyData).sort().map(([month, rev]) => ({ month, revenue: rev }));

  const stats = [
    { label: "Total Bookings", value: total, icon: CalendarDays, color: "text-primary" },
    { label: "Total Revenue", value: `$${revenue.toFixed(0)}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "Active Rentals", value: active, icon: Car, color: "text-blue-500" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Revenue (Completed Bookings)</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No completed bookings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
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
