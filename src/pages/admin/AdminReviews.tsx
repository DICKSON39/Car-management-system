import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Car, User, MessageSquare, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminReviews() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cars(name), drivers(name), profiles:user_id(full_name)")
        .not("rating", "is", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate Average Rating
  const avgRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Quality</h1>
          <p className="text-muted-foreground">Monitor customer satisfaction and driver performance.</p>
        </div>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-amber-700">Average Score</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-amber-900">{avgRating}</span>
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews?.length || 0}</div>
          </CardContent>
        </Card>
        {/* You could add more stat cards here for 5-star counts, etc. */}
      </div>

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Car & Driver</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="max-w-[300px]">Review Comment</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {(r as any).profiles?.full_name || "Unknown User"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Car className="h-3 w-3" /> {(r as any).cars?.name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="h-3 w-3" /> {(r as any).drivers?.name || "No Driver"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} 
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  {r.review_text ? (
                    <div className="flex items-start gap-2 bg-muted/30 p-2 rounded text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      <span className="italic">"{r.review_text}"</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">No comment provided</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(r.updated_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}