import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Star, Car, ShieldCheck, Clock, MessageSquare, ArrowRight, 
  Users, Fuel, Gauge, Send, Loader2, Mail, Phone, MapPin,
  Facebook, Instagram, Twitter, Menu, X, AlertTriangle 
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    subject: "",
    message: ""
  });

  // --- FETCH GLOBAL SETTINGS ---
  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("id", "global_config")
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch Cars
  const { data: featuredCars } = useQuery({
    queryKey: ["featured-cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").limit(3);
      if (error) throw error;
      return data;
    },
  });

  // fetching real data
const { data: stats } = useQuery({
  queryKey: ["live-stats"],
  queryFn: async () => {
    // Get total cars
    const { count: carCount } = await supabase
      .from("cars")
      .select("*", { count: 'exact', head: true });

    // Get total users (profiles)
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });

    return {
      cars: carCount || 0,
      users: (userCount || 0) + 150, // Adding a "base" number for a established feel
      cities: 5, // You can make this dynamic if you have a locations table
    };
  },
});

  // Fetch Testimonials
  const { data: testimonials } = useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("rating, review_text, profiles:user_id(full_name), cars(name)")
        .not("rating", "is", null)
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (newData: typeof formData) => {
      const { error } = await supabase.from("contact_inquiries").insert([newData]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Message Sent!", description: "We'll get back to you shortly." });
      setFormData({ full_name: "", email: "", subject: "", message: "" });
    },
  });

  // --- MAINTENANCE MODE OVERLAY ---
  if (settings?.maintenance_mode) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center space-y-6 bg-background">
        <div className="bg-amber-100 p-6 rounded-full text-amber-600 animate-pulse">
          <AlertTriangle className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-black italic uppercase">Under Maintenance</h1>
        <p className="text-muted-foreground max-w-md italic">
          We are currently updating {settings?.site_name || "our platform"} to serve you better. 
          We'll be back online shortly!
        </p>
        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

 return (
  <div className="flex flex-col min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">
    
    {/* --- NAVIGATION: Glassmorphism & Minimalist --- */}
    <nav className="flex items-center justify-between px-8 py-5 sticky top-0 bg-white/70 backdrop-blur-xl z-[100] border-b border-slate-100">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
        <div className="bg-slate-900 p-2 rounded-xl group-hover:bg-primary transition-colors duration-300">
          <Car className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          {settings?.site_name || "DRIVEFLOW"}
        </span>
      </div>

      <div className="hidden md:flex gap-10 text-[13px] font-medium uppercase tracking-widest text-slate-500">
        <a href="#fleet" className="hover:text-slate-900 transition-colors">Fleet</a>
        <a href="#services" className="hover:text-slate-900 transition-colors">Experience</a>
        <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={() => navigate("/auth")} variant="ghost" className="hidden md:flex font-medium hover:bg-slate-100">
          Login
        </Button>
        <Button onClick={() => navigate("/auth")} className="hidden md:flex bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 shadow-sm">
          Book Now
        </Button>
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>

    {/* --- HERO: Clean & Airy --- */}
    <header className="relative px-6 py-32 md:py-48 text-center overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] -z-10 rounded-full" />
      
      <div className="max-w-4xl mx-auto space-y-8">
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-4 py-1.5 rounded-full text-xs font-medium lowercase tracking-normal">
          — introducing the 2026 winter collection
        </Badge>
        <h1 className="text-6xl md:text-8xl font-medium tracking-tight text-slate-900 leading-[0.9]">
          Travel in <span className="font-serif italic text-primary">absolute</span> comfort.
        </h1>
        <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto font-light leading-relaxed">
          The most seamless way to access premium vehicles. No lines, no hidden fees, just the open road.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
          <Button size="lg" onClick={() => navigate("/auth")} className="h-16 px-12 rounded-full text-base bg-primary hover:opacity-90 transition-all shadow-xl shadow-primary/10">
            View the Fleet
          </Button>
          <Button variant="link" className="text-slate-500 hover:text-primary gap-2">
            See how it works <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

    {/* --- FEATURED CARS: Modern Cards --- */}
    <section id="fleet" className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-12">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Our Selection</h2>
          <p className="text-slate-400">Pristine condition. Unlimited memories.</p>
        </div>
        <Button variant="outline" className="rounded-full border-slate-200">View All</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {featuredCars?.map((car) => (
          <div key={car.id} className="group cursor-pointer">
            <div className="aspect-[4/5] relative rounded-[2rem] overflow-hidden bg-slate-100 mb-6">
              <img 
                src={car.image_url || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"} 
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-in-out" 
              />
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/80 backdrop-blur-md rounded-2xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Button className="w-full bg-slate-900 text-white rounded-xl" onClick={() => navigate("/auth")}>
                  Check Availability
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-start px-2">
              <div>
                <h3 className="text-xl font-medium text-slate-900">{car.name}</h3>
                <p className="text-slate-400 text-sm mt-1">Automatic • Luxury Suite</p>
              </div>
              <p className="text-lg font-semibold text-primary">
                {settings?.currency_symbol || "$"}{car.price_per_day}<span className="text-xs text-slate-400 font-normal">/day</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* --- STATS: Minimalist Inset --- */}
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto bg-slate-950 rounded-[3rem] p-12 md:p-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-medium leading-tight">We’ve reimagined the <br/><span className="text-slate-400">rental experience.</span></h2>
            <p className="text-slate-400 font-light text-lg">Founded in 2020, we've delivered over 50,000+ premium experiences across the globe.</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-3xl font-medium">{stats?.users}+</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter font-bold">Members</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-medium">{stats?.cars}</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter font-bold">Premium Cars</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-medium">{stats?.cities}</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter font-bold">World Cities</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-medium">99.8%</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter font-bold">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* --- CONTACT: Side-by-Side Modern --- */}
    <section id="contact" className="py-32 px-6 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-24 items-center">
      <div className="space-y-10">
        <div className="space-y-4">
          <h2 className="text-5xl font-medium tracking-tighter">Let's talk.</h2>
          <p className="text-slate-500 text-lg leading-relaxed">Our concierge team is available 24/7 to assist with your custom requirements.</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center gap-6 group">
            <div className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary transition-colors">
              <Mail className="h-5 w-5 text-slate-400 group-hover:text-primary" />
            </div>
            <span className="font-medium">{settings?.support_email}</span>
          </div>
          <div className="flex items-center gap-6 group">
            <div className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary transition-colors">
              <Phone className="h-5 w-5 text-slate-400 group-hover:text-primary" />
            </div>
            <span className="font-medium">{settings?.support_phone}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); contactMutation.mutate(formData); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Full Name</label>
            <Input className="h-14 bg-slate-50 border-none rounded-xl focus-visible:ring-1 ring-primary" placeholder="John Doe" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Email</label>
            <Input className="h-14 bg-slate-50 border-none rounded-xl focus-visible:ring-1 ring-primary" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Message</label>
            <Textarea className="bg-slate-50 border-none rounded-xl min-h-[120px] focus-visible:ring-1 ring-primary" placeholder="What's on your mind?" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
          </div>
          <Button type="submit" className="w-full h-14 bg-primary text-white font-medium rounded-xl shadow-lg shadow-primary/20" disabled={contactMutation.isPending}>
            {contactMutation.isPending ? <Loader2 className="animate-spin" /> : "Send Inquiry"}
          </Button>
        </form>
      </div>
    </section>

    {/* --- FOOTER: Clean Dark --- */}
    <footer className="bg-white border-t border-slate-100 py-16 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold tracking-tight uppercase">{settings?.site_name}</span>
        </div>
        
        <div className="flex gap-12 text-sm text-slate-400">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Fleet Registry</a>
        </div>

        <div className="flex gap-6">
          <Instagram className="h-5 w-5 text-slate-400 hover:text-primary cursor-pointer transition-colors" />
          <Twitter className="h-5 w-5 text-slate-400 hover:text-primary cursor-pointer transition-colors" />
          <Facebook className="h-5 w-5 text-slate-400 hover:text-primary cursor-pointer transition-colors" />
        </div>
      </div>
      <div className="text-center mt-12 text-xs text-slate-300 font-light">
        © 2026 {settings?.site_name}. Handcrafted for the road.
      </div>
    </footer>
  </div>
);
}