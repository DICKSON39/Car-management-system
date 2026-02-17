import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // Ensure you have this UI component
import { Plus, Pencil, Stepper, Car } from "lucide-react";

interface DriverForm { name: string; phone: string; license_number: string; available: boolean; }
const empty: DriverForm = { name: "", phone: "", license_number: "", available: true };

export default function AdminDrivers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<DriverForm>(empty);

  // 1. Fetch Drivers
  const { data: drivers, isLoading } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => { 
      const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false }); 
      if (error) throw error; 
      return data; 
    },
  });

  // 2. Fetch Active Bookings to show "On Trip" status
  const { data: activeBookings } = useQuery({
    queryKey: ["active-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("driver_id, status, cars(name)")
        .eq("status", "confirmed");
      if (error) throw error;
      return data;
    },
  });

  const saveDriver = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("drivers").update(form).eq("id", editing); if (error) throw error;
      } else {
        const { error } = await supabase.from("drivers").insert(form); if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-drivers"] }); setOpen(false); setEditing(null); setForm(empty); toast({ title: editing ? "Driver updated" : "Driver added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAvail = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => { const { error } = await supabase.from("drivers").update({ available }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-drivers"] }),
  });

  const openEdit = (d: any) => { setForm({ name: d.name, phone: d.phone, license_number: d.license_number, available: d.available }); setEditing(d.id); setOpen(true); };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Drivers</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Driver</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>License Number</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
              <Button className="w-full" onClick={() => saveDriver.mutate()} disabled={!form.name.trim() || saveDriver.isPending}>
                {saveDriver.isPending ? "Saving..." : editing ? "Update Driver" : "Add Driver"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Driver Details</TableHead>
              <TableHead className="font-semibold">License</TableHead>
              <TableHead className="font-semibold">Live Status</TableHead>
              <TableHead className="font-semibold">System Access</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers?.map((d) => {
              // Find if driver is currently on an active booking
              const currentBooking = activeBookings?.find(b => b.driver_id === d.id);
              
              return (
                <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.license_number}</TableCell>
                  <TableCell>
                    {currentBooking ? (
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-600 gap-1">
                        <Car className="h-3 w-3" /> On Trip: {(currentBooking.cars as any)?.name}
                      </Badge>
                    ) : d.available ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        Off-Duty
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={d.available} 
                        onCheckedChange={(v) => toggleAvail.mutate({ id: d.id, available: v })} 
                        disabled={toggleAvail.isPending}
                      />
                      <span className="text-xs text-muted-foreground">
                        {d.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}