import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, ShieldAlert, Globe, PhoneCall } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("id", "global_config")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from("admin_settings")
        .update(updatedData)
        .eq("id", "global_config");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Settings Saved", description: "Changes are now live across the platform." });
    },
  });

  if (isLoading) return <div className="p-8 space-y-4">Loading Configuration...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" /> System Settings
        </h1>
        <p className="text-muted-foreground">Configure global variables and contact details.</p>
      </div>

      <div className="grid gap-6">
        {/* General Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" /> Brand Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Site Name</label>
                <Input 
                  defaultValue={config?.site_name} 
                  onChange={(e) => updateSettings.mutate({ site_name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Currency Symbol</label>
                <Input 
                  defaultValue={config?.currency_symbol} 
                  onChange={(e) => updateSettings.mutate({ currency_symbol: e.target.value })} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PhoneCall className="h-5 w-5" /> Support Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Public Email</label>
                <Input 
                  defaultValue={config?.support_email} 
                  onBlur={(e) => updateSettings.mutate({ support_email: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Public Phone</label>
                <Input 
                  defaultValue={config?.support_phone} 
                  onBlur={(e) => updateSettings.mutate({ support_phone: e.target.value })} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Actions */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <ShieldAlert className="h-5 w-5" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-bold">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground italic">
                Prevent customers from making new bookings temporarily.
              </p>
            </div>
            <Switch 
              checked={config?.maintenance_mode} 
              onCheckedChange={(val) => updateSettings.mutate({ maintenance_mode: val })} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}