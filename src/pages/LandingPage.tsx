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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      
      {/* --- NAVIGATION --- */}
      <nav className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="bg-primary p-2 rounded-lg">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tighter italic uppercase">
            {settings?.site_name || "DRIVEFLOW"}
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#fleet" className="hover:text-primary transition-colors">Fleet</a>
          <a href="#services" className="hover:text-primary transition-colors">Services</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/auth")} className="hidden md:flex font-bold rounded-full px-6 shadow-lg shadow-primary/20">
            Sign In
          </Button>
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background border-b p-6 flex flex-col gap-4 md:hidden shadow-xl animate-in slide-in-from-top">
            <a href="#fleet" onClick={() => setIsMenuOpen(false)} className="font-bold">Our Fleet</a>
            <a href="#services" onClick={() => setIsMenuOpen(false)} className="font-bold">Services</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="font-bold">Contact</a>
            <Button onClick={() => navigate("/auth")} className="w-full">Sign In</Button>
          </div>
        )}
      </nav>

      {/* --- HERO --- */}
      <header className="px-6 py-20 text-center max-w-5xl mx-auto">
        <Badge variant="outline" className="mb-6 border-primary text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">
          {settings?.site_name} Premium Rentals 2026
        </Badge>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight mb-6 uppercase">
          RENT THE <span className="text-primary italic underline decoration-4 underline-offset-8">BEST.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
          Experience the ultimate road trip with our handpicked luxury fleet. 
          Book in seconds with {settings?.site_name}.
        </p>
        <Button size="lg" onClick={() => navigate("/auth")} className="h-14 px-10 rounded-full text-lg gap-2 shadow-2xl shadow-primary/30">
          Start Journey <ArrowRight />
        </Button>
      </header>

      {/* --- FEATURED CARS --- */}
      <section id="fleet" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-black italic uppercase mb-12 border-l-4 border-primary pl-4">Our Fleet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredCars?.map((car) => (
            <Card key={car.id} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="aspect-video relative overflow-hidden">
                <img src={car.image_url || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                  {settings?.currency_symbol || "$"}{car.price_per_day}/day
                </div>
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">{car.name}</h3>
                <div className="flex justify-between text-xs text-muted-foreground font-bold uppercase">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 5 Seats</span>
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Auto</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full rounded-full font-bold" variant="secondary" onClick={() => navigate("/auth")}>Book Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* --- SERVICES & STATS SECTION --- */}
      <section id="services" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">
              Why Choose <span className="text-primary">{settings?.site_name || "DRIVEFLOW"}?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto italic font-medium">
              We’ve simplified car rentals so you can focus on the destination, not the paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            {/* Service 1 */}
            <div className="group space-y-4 p-8 bg-background rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/20">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold uppercase italic tracking-tight">Fully Insured</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drive with total peace of mind. Every rental comes with comprehensive insurance coverage and 24/7 roadside assistance.
              </p>
            </div>

            {/* Service 2 */}
            <div className="group space-y-4 p-8 bg-background rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/20">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold uppercase italic tracking-tight">Expert Drivers</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Don't want to drive? Book one of our professional, vetted chauffeurs to get you to your destination safely and on time.
              </p>
            </div>

            {/* Service 3 */}
            <div className="group space-y-4 p-8 bg-background rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/20">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold uppercase italic tracking-tight">Flexible Rental</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Whether you need a car for a few hours, a day, or a month, our flexible booking system adapts to your schedule.
              </p>
            </div>
          </div>

         
         {/* --- STATS COUNTER BAR (Live Data) --- */}
<div className="bg-foreground text-background rounded-[2rem] p-10 md:p-16 shadow-2xl">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    <div className="space-y-2 border-r border-white/10 last:border-none">
      <h4 className="text-4xl md:text-5xl font-black text-primary italic">
        {stats?.users}+
      </h4>
      <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground">Happy Clients</p>
    </div>
    
    <div className="space-y-2 border-r border-white/10 last:border-none">
      <h4 className="text-4xl md:text-5xl font-black text-primary italic">
        {stats?.cars}
      </h4>
      <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground">Available Cars</p>
    </div>

    <div className="space-y-2 border-r border-white/10 last:border-none">
      <h4 className="text-4xl md:text-5xl font-black text-primary italic">
        {stats?.cities}
      </h4>
      <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground">Main Branches</p>
    </div>

    <div className="space-y-2">
      <h4 className="text-4xl md:text-5xl font-black text-primary italic">24/7</h4>
      <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground">Expert Support</p>
    </div>
  </div>
</div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="bg-primary/5 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-4xl font-black italic mb-16 uppercase">Driver Feedback</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials?.map((t, i) => (
              <Card key={i} className="bg-background border-none shadow-sm relative pt-4">
                <CardContent className="space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`h-4 w-4 ${idx < (t.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                    ))}
                  </div>
                  <p className="italic text-muted-foreground text-sm leading-relaxed">"{t.review_text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {(t as any).profiles?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold italic">{(t as any).profiles?.full_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Rented {(t as any).cars?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="py-24 px-6 max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-16">
        <div className="space-y-6">
          <h2 className="text-5xl font-black italic tracking-tighter">GET IN <br /> <span className="text-primary underline">TOUCH.</span></h2>
          <p className="text-muted-foreground leading-relaxed">Questions? Reach out via our channels below.</p>
          <div className="space-y-3">
             <div className="flex items-center gap-4 text-sm font-medium"><Mail className="text-primary h-5 w-5" /> {settings?.support_email}</div>
             <div className="flex items-center gap-4 text-sm font-medium"><Phone className="text-primary h-5 w-5" /> {settings?.support_phone}</div>
          </div>
        </div>
        <Card className="shadow-2xl border-none">
          <CardContent className="pt-8">
            <form onSubmit={(e) => { e.preventDefault(); contactMutation.mutate(formData); }} className="space-y-4">
              <Input placeholder="Your Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
              <Input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <Textarea placeholder="How can we help?" className="min-h-[120px]" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
              <Button type="submit" className="w-full h-12 font-bold" disabled={contactMutation.isPending}>
                {contactMutation.isPending ? <Loader2 className="animate-spin" /> : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-foreground text-background py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-xl font-black italic uppercase">{settings?.site_name}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">Powered by {settings?.site_name} Fleet Management.</p>
          </div>
          <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
          <div className="flex justify-end gap-4">
            <Facebook className="hover:text-primary cursor-pointer transition-colors" />
            <Instagram className="hover:text-primary cursor-pointer transition-colors" />
            <Twitter className="hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>
        <div className="text-center pt-12 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
           © 2026 {settings?.site_name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}