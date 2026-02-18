import { Car, CalendarDays, History, LayoutDashboard, Users, Truck, BarChart3, LogOut, icons, Icon, Settings, User2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { url } from "inspector";
import { profile } from "console";
import { title } from "process";

const customerLinks = [
  { title: "Browse Cars", url: "/cars", icon: Car },
  { title: "My Bookings", url: "/bookings", icon: History },
  {title: "profile", url: '/profile', icon: Users },
];

const adminLinks = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Bookings", url: "/admin/bookings", icon: CalendarDays },
  { title: "Cars", url: "/admin/cars", icon: Car },
  { title: "Drivers", url: "/admin/drivers", icon: Users },
  { title: "Revenue", url: "/admin/revenue", icon: BarChart3 },
  {title: "profile", url: '/profile', icon: User2 },
  {title: "reviews", url: '/reviews/admin', icon:BarChart3},
  {title: "messages", url: '/messages', icon:BarChart3},
  {title: "settings", url: '/settings', icon:Settings}
];

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const links = role === "admin" ? adminLinks : customerLinks;

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 px-4 py-3">
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">RentWheels</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} className="hover:bg-accent" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
