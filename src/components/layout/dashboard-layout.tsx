"use client";

import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Bell, Search, Globe, Check, Sun, Moon } from 'lucide-react';
import { useApp } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, language, setLanguage, theme, toggleTheme } = useApp();

  const languages = [
    { id: 'en', name: 'English' },
    { id: 'kn', name: 'ಕನ್ನಡ' },
    { id: 'hi', name: 'हिन्दी' },
  ] as const;

  const profileImg = user?.profileImage || `https://picsum.photos/seed/${user?.uid}/40/40`;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
          <SidebarTrigger />
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-sm hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stations, users..."
                className="pl-9 bg-secondary/50 border-none h-9 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:bg-accent"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border min-w-[150px] rounded-xl shadow-2xl">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.id} 
                    onClick={() => setLanguage(lang.id)}
                    className="flex items-center justify-between cursor-pointer focus:bg-primary/10 focus:text-primary py-2"
                  >
                    <span className="text-sm">{lang.name}</span>
                    {language === lang.id && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-accent">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            </Button>
            
            <Link 
              href="/profile" 
              className="flex items-center gap-3 pl-2 border-l hover:opacity-80 transition-opacity"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium">{user?.fullName || user?.email?.split('@')[0]}</span>
                <Badge variant="outline" className="text-[10px] h-4 py-0 success-badge">
                  {user?.role}
                </Badge>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={profileImg} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}