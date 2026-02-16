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
import { Plus, Pencil } from "lucide-react";

interface DriverForm { name: string; phone: string; license_number: string; available: boolean; }
const empty: DriverForm = { name: "", phone: "", license_number: "", available: true };

export default function AdminDrivers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<DriverForm>(empty);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: async () => { const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Drivers</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Driver</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>License Number</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
              <Button className="w-full" onClick={() => saveDriver.mutate()} disabled={!form.name.trim()}>{editing ? "Update" : "Add"} Driver</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.phone}</TableCell>
                <TableCell>{d.license_number}</TableCell>
                <TableCell><Switch checked={d.available} onCheckedChange={(v) => toggleAvail.mutate({ id: d.id, available: v })} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
