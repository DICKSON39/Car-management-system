import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Car, ShieldCheck, Clock, ArrowRight, Users, 
  Gauge, Loader2, Mail, Phone, Menu, X, Plus
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", email: "", subject: "", message: "" });

  // --- DATA FETCHING ---
  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_settings").select("*").eq("id", "global_config").single();
      return data;
    }
  });

  const { data: featuredCars } = useQuery({
    queryKey: ["featured-cars"],
    queryFn: async () => {
      const { data } = await supabase.from("cars").select("*").limit(3);
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["live-stats"],
    queryFn: async () => {
      const [cars, profiles] = await Promise.all([
        supabase.from("cars").select("*", { count: 'exact', head: true }),
        supabase.from("profiles").select("*", { count: 'exact', head: true })
      ]);
      return { cars: cars.count || 0, users: (profiles.count || 0) + 100, cities: 5 };
    },
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      
      {/* --- MINIMAL STICKY NAV --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-[100] bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <div className="bg-[#1A1A1A] p-1 rounded-md">
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tighter uppercase">{settings?.site_name || "Drive"}</span>
        </div>

        <div className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-widest text-black/40">
          <a href="#fleet" className="hover:text-black transition-colors">Fleet</a>
          <a href="#services" className="hover:text-black transition-colors">Services</a>
          <a href="#contact" className="hover:text-black transition-colors">Contact</a>
        </div>

        <Button onClick={() => navigate("/auth")} className="rounded-xl bg-amber-500 hover:bg-white px-6 text-xs font-bold h-10">
          SIGN IN
        </Button>
      </nav>

      {/* --- SPLIT HERO --- */}
      <header className="pt-48 pb-24 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <Badge className="bg-white border border-black/5 text-black px-4 py-1 rounded-lg shadow-sm">
            Est. 2026
          </Badge>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-[#1A1A1A]">
            MOVE <br /> BEYOND <br /> <span className="text-black/20">LIMITS.</span>
          </h1>
          <p className="text-lg text-black/50 max-w-md font-medium leading-relaxed">
            Premium vehicle access redefined. No paperwork, no delays. Just pure mobility at your fingertips.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="h-16 px-10 rounded-2xl bg-[#1A1A1A] text-white text-lg font-bold group">
            Explore Collection <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        <div className="relative aspect-square md:aspect-auto md:h-[600px] bg-white rounded-[3rem] overflow-hidden shadow-inner border border-black/5">
          <img 
            src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800" 
            className="w-full h-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-1000"
          />
        </div>
      </header>

      {/* --- FEATURED FLEET (CARDS) --- */}
      <section id="fleet" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-bold tracking-tighter uppercase">The Selection</h2>
          <span className="text-xs font-bold text-black/30 tracking-widest">[ 03 FEATURED UNITS ]</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCars?.map((car) => (
            <div key={car.id} className="group bg-white rounded-[2rem] p-4 border border-black/5 hover:border-black/20 transition-all">
              <div className="aspect-[16/10] rounded-[1.5rem] overflow-hidden bg-[#F5F5F7] relative">
                <img src={car.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-xl border-none font-bold shadow-sm">
                    ${car.price_per_day} / DAY
                  </Badge>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold tracking-tight uppercase">{car.name}</h3>
                  <div className="h-8 w-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex gap-4 text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2"><Users className="h-3 w-3" /> 05 Seats</span>
                  <span className="flex items-center gap-2"><Gauge className="h-3 w-3" /> V8 Sport</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SERVICE GRID --- */}
      <section id="services" className="py-24 px-6 bg-[#1A1A1A] text-white rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1 space-y-6">
            <h2 className="text-5xl font-bold tracking-tighter uppercase leading-none">Why <br /> Drive <br /> Flow?</h2>
            <p className="text-white/40 font-medium">We’ve removed the friction from high-end rentals.</p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-8">
            {[
              { icon: ShieldCheck, title: "Total Protection", desc: "Full liability coverage included in every tier. No exceptions." },
              { icon: Clock, title: "Instant Pickup", desc: "Unlock via smartphone. From booking to driving in 60 seconds." },
              { icon: Plus, title: "Delivery Service", desc: "We drop the vehicle at your location within 30 minutes." },
              { icon: Gauge, title: "Fleet Freshness", desc: "Our cars are never older than 12 months. Guaranteed." }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <item.icon className="h-8 w-8 text-white mb-6" />
                <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">{item.title}</h4>
                <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="py-32 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
        <div className="space-y-8">
          <h2 className="text-6xl font-bold tracking-tighter uppercase leading-none text-[#1A1A1A]">Let's <br /> Talk.</h2>
          <div className="space-y-2">
            <p className="text-xl font-bold underline decoration-2 underline-offset-8">{settings?.support_email}</p>
            <p className="text-xl font-bold underline decoration-2 underline-offset-8">{settings?.support_phone}</p>
          </div>
        </div>
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-black/5">
          <form className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Full Name</label>
              <Input className="h-14 rounded-2xl bg-[#F5F5F7] border-none px-6 focus:ring-2 ring-black/5" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Email</label>
              <Input className="h-14 rounded-2xl bg-[#F5F5F7] border-none px-6 focus:ring-2 ring-black/5" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Message</label>
              <Textarea className="min-h-[120px] rounded-2xl bg-[#F5F5F7] border-none p-6 focus:ring-2 ring-black/5" />
            </div>
            <Button className="w-full h-16 rounded-2xl bg-[#1A1A1A] text-white font-bold uppercase tracking-widest">
              Send Inquiry
            </Button>
          </form>
        </div>
      </section>

      <footer className="py-12 px-8 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-black/20">
        © 2026 {settings?.site_name} // Global Logistics // Switzerland // NY // Tokyo
      </footer>
    </div>
  );
}