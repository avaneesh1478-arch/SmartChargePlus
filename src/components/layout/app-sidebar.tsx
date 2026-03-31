"use client";

import { LayoutDashboard, Zap, Activity, Users, CreditCard, LogOut, ShieldCheck, Map as MapIcon, History, FileText, Info } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useApp } from '@/hooks/use-store';
import { useRouter, usePathname } from 'next/navigation';

export function AppSidebar() {
  const { user, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN', 'OPERATOR', 'USER'] },
    { title: 'Stations', icon: MapIcon, path: '/stations', roles: ['ADMIN', 'OPERATOR', 'USER'] },
    { title: 'Analytics', icon: Activity, path: '/analytics', roles: ['ADMIN', 'OPERATOR'] },
    { title: 'Station Details', icon: Info, path: '/operator/station-details', roles: ['OPERATOR'] },
    { title: 'Users', icon: Users, path: '/users', roles: ['ADMIN'] },
    { title: 'Content', icon: FileText, path: '/admin/content', roles: ['ADMIN'] },
    { title: 'Wallet', icon: CreditCard, path: '/wallet', roles: ['USER'] },
    { title: 'Charging History', icon: History, path: '/history', roles: ['USER'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="flex items-center gap-2 px-4 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none transition-all group-data-[collapsible=icon]:hidden">
          <span className="text-xl font-bold tracking-tight text-primary">Smart Charge+</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Network Management</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.path)}
                    isActive={pathname === item.path}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
