import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Search, Users, Fuel } from "lucide-react";

export default function Cars() {
  const [search, setSearch] = useState("");
  const [tripFilter, setTripFilter] = useState("all");
  const navigate = useNavigate();

  const { data: cars, isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").eq("available", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = cars?.filter((car) => {
    const matchesSearch = car.name.toLowerCase().includes(search.toLowerCase());
    const matchesTrip = tripFilter === "all" || car.trip_type === tripFilter;
    return matchesSearch && matchesTrip;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Browse Cars</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cars..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tripFilter} onValueChange={setTripFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trip type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="wedding">Wedding</SelectItem>
            <SelectItem value="airport">Airport</SelectItem>
            <SelectItem value="long_trip">Long Trip</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((car) => (
            <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/cars/${car.id}`)}>
              <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
                {car.image_url ? (
                  <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
                ) : (
                  <Fuel className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{car.name}</CardTitle>
                  <Badge variant="secondary" className="capitalize">{car.trip_type.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {car.capacity} seats</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-xl font-bold text-primary">${Number(car.price_per_day).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/day</span></span>
                <Button size="sm">Book Now</Button>
              </CardFooter>
            </Card>
          ))}
          {filtered?.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No cars found.</p>}
        </div>
      )}
    </div>
  );
}
