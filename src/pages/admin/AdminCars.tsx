import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Loader2, Image as ImageIcon } from "lucide-react"; // Added icons
import { Textarea } from "@/components/ui/textarea";

interface CarForm { name: string; image_url: string; trip_type: string; capacity: number; price_per_day: number; description: string; available: boolean; }
const empty: CarForm = { name: "", image_url: "", trip_type: "wedding", capacity: 4, price_per_day: 0, description: "", available: true };

export default function AdminCars() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CarForm>(empty);
  const [uploading, setUploading] = useState(false); // New state for upload

  // --- NEW: UPLOAD LOGIC ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // 1. Generate unique path
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      // 2. Upload to 'car-images' bucket
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get URL and update form
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      setForm({ ...form, image_url: publicUrl });
      toast({ title: "Image uploaded!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ... (keep useQuery and other mutations the same) ...
  const { data: cars, isLoading } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: async () => { const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });

  const saveCar = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("cars").update(form).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cars").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cars"] }); setOpen(false); setEditing(null); setForm(empty); toast({ title: editing ? "Car updated" : "Car added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCar = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("cars").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cars"] }); toast({ title: "Car deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAvail = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => { const { error } = await supabase.from("cars").update({ available }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cars"] }),
  });

  const openEdit = (car: any) => { setForm({ name: car.name, image_url: car.image_url || "", trip_type: car.trip_type, capacity: car.capacity, price_per_day: Number(car.price_per_day), description: car.description || "", available: car.available }); setEditing(car.id); setOpen(true); };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Cars</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Car</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Car" : "Add Car"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              
              {/* --- UPDATED IMAGE SECTION --- */}
              <div className="space-y-2">
                <Label>Car Image</Label>
                <div className="flex items-center gap-4">
                  {form.image_url && (
                    <img src={form.image_url} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                  </div>
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground">Uploading automatically generates the URL.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Trip Type</Label>
                  <Select value={form.trip_type} onValueChange={(v) => setForm({ ...form, trip_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="wedding">Wedding</SelectItem><SelectItem value="airport">Airport</SelectItem><SelectItem value="long_trip">Long Trip</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Price / Day ($)</Label><Input type="number" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button className="w-full" onClick={() => saveCar.mutate()} disabled={!form.name.trim() || uploading}>{editing ? "Update" : "Add"} Car</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ... (rest of the table code) ... */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead> {/* New column */}
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price/Day</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars?.map((car) => (
              <TableRow key={car.id}>
                <TableCell>
                  <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                    {car.image_url ? <img src={car.image_url} className="h-full w-full object-cover" /> : <ImageIcon className="h-full w-full p-2 text-muted-foreground" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{car.name}</TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{car.trip_type.replace("_", " ")}</Badge></TableCell>
                <TableCell>{car.capacity}</TableCell>
                <TableCell>${Number(car.price_per_day).toFixed(0)}</TableCell>
                <TableCell><Switch checked={car.available} onCheckedChange={(v) => toggleAvail.mutate({ id: car.id, available: v })} /></TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(car)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCar.mutate(car.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}