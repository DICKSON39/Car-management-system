import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Loader2, Save, Lock, Eye, EyeOff, LogOut } from "lucide-react";

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // 1. Fetch Profile Data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return { ...data, email: user.email };
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // 2. Mutations
  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: updates.full_name, phone: updates.phone })
        .eq("id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Success", description: "Profile details updated." });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      toast({ title: "Security Updated", description: "Your password has been changed." });
    },
    onError: (error: any) => {
      toast({ title: "Security Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: "Failed to sign out", variant: "destructive" });
    } else {
      navigate("/auth"); // Adjust this path to your login page
    }
  };

  if (isLoading) return <div className="p-8 max-w-2xl mx-auto space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your identity and account security.</p>
      </div>

      {/* SECTION 1: PERSONAL INFO */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Personal Details
          </CardTitle>
          <CardDescription>Update your contact information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={formData.full_name} 
              onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
               <Input id="email" value={formData.email} disabled className="bg-muted pl-9" />
               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
               <Input 
                id="phone" 
                value={formData.phone} 
                className="pl-9"
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-3">
          <Button onClick={() => updateProfile.mutate(formData)} disabled={updateProfile.isPending} className="ml-auto">
            {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Details
          </Button>
        </CardFooter>
      </Card>

      {/* SECTION 2: SECURITY */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" /> Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input 
                id="new-password" 
                type={showPassword ? "text" : "password"} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Minimum 6 characters required.</p>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-amber-50/50 px-6 py-3">
          <Button 
            variant="outline"
            className="ml-auto border-amber-200 text-amber-700 hover:bg-amber-100"
            disabled={!newPassword || newPassword.length < 6 || updatePassword.isPending}
            onClick={() => updatePassword.mutate(newPassword)}
          >
            {updatePassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Update Password
          </Button>
        </CardFooter>
      </Card>

      {/* SECTION 3: DANGER ZONE */}
      <Card className="border-red-100 bg-red-50/20">
        <CardHeader>
          <CardTitle className="text-xl text-red-600 flex items-center gap-2">
            <LogOut className="h-5 w-5" /> Session
          </CardTitle>
          <CardDescription>Sign out of your account on this device.</CardDescription>
        </CardHeader>
        <CardFooter className="px-6 py-4">
          <Button variant="destructive" className="w-full sm:w-auto" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}