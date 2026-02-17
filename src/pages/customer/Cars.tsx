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
import { Search, Users, Fuel, Ban } from "lucide-react";

export default function Cars() {
  const [search, setSearch] = useState("");
  const [tripFilter, setTripFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // New state for Booked/Available
  const navigate = useNavigate();

  const { data: cars, isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      // Removed .eq("available", true) to ensure we fetch everything
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = cars?.filter((car) => {
    const matchesSearch = car.name.toLowerCase().includes(search.toLowerCase());
    const matchesTrip = tripFilter === "all" || car.trip_type === tripFilter;
    
    // Logic for Booked vs Available
    const matchesStatus = 
      statusFilter === "all" ? true : 
      statusFilter === "available" ? car.available === true : 
      car.available === false; // "booked"

    return matchesSearch && matchesTrip && matchesStatus;
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Cars</h1>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search cars..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>

        {/* New Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available Now</SelectItem>
            <SelectItem value="booked">Already Booked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tripFilter} onValueChange={setTripFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
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
            <Card 
              key={car.id} 
              className={`overflow-hidden transition-all duration-300 ${
                car.available ? "hover:shadow-lg cursor-pointer" : "opacity-80"
              }`}
              onClick={() => car.available && navigate(`/cars/${car.id}`)}
            >
              <div className="relative h-48 bg-muted flex items-center justify-center overflow-hidden">
                {/* Booked Overlay */}
                {!car.available && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-4 py-1 gap-2">
                      <Ban className="h-4 w-4" /> Booked
                    </Badge>
                  </div>
                )}

                {car.image_url ? (
                  <img 
                    src={car.image_url} 
                    alt={car.name} 
                    className={`w-full h-full object-cover transition-transform duration-300 ${car.available ? 'hover:scale-110' : ''}`} 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Fuel className="h-12 w-12" />
                    <span className="text-xs">No Image Available</span>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{car.name}</CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {car.trip_type.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {car.capacity} seats
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <span className="text-xl font-bold text-primary">
                  ${Number(car.price_per_day).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">/day</span>
                </span>
                <Button 
                  size="sm" 
                  disabled={!car.available}
                  className={!car.available ? "bg-muted text-muted-foreground" : ""}
                >
                  {car.available ? "Book Now" : "Reserved"}
                </Button>
              </CardFooter>
            </Card>
          ))}

          {filtered?.length === 0 && (
            <div className="text-muted-foreground col-span-full text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-lg">No cars match your current filters.</p>
              <Button variant="link" onClick={() => {setSearch(""); setStatusFilter("all"); setTripFilter("all");}}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}