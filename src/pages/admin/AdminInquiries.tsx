import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, MessageSquare, CheckCircle, Clock, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AdminInquiries() {
  const queryClient = useQueryClient();

  // 1. Fetch all inquiries
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // 2. Mutation to mark as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_inquiries")
        .update({ status: "read" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      toast({ title: "Inquiry Updated", description: "Marked as read." });
    },
  });

  if (isLoading) return <div className="p-8 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Inquiries</h1>
          <p className="text-muted-foreground">Manage messages and leads from your landing page.</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold">{inquiries?.filter(i => i.status === 'unread').length} Unread</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Subject & Message</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                  No inquiries yet. They will appear here when someone uses the contact form.
                </TableCell>
              </TableRow>
            ) : (
              inquiries?.map((inquiry) => (
                <TableRow key={inquiry.id} className={inquiry.status === 'unread' ? "bg-primary/5 font-medium" : ""}>
                  <TableCell>
                    <Badge variant={inquiry.status === 'unread' ? "default" : "outline"} className="uppercase text-[10px]">
                      {inquiry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold flex items-center gap-1">
                        <User className="h-3 w-3" /> {inquiry.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{inquiry.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary italic">Re: {inquiry.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">"{inquiry.message}"</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {inquiry.status === 'unread' ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => markAsRead.mutate(inquiry.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Read
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" disabled>
                        Done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}