
"use client";

import { useApp } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Zap, Globe, User, MapPin, Clock, Shield, ChevronRight, Check, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';

export default function Home() {
  const { user, language, setLanguage, theme, toggleTheme, t } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const languages = [
    { id: 'en', name: 'English', label: 'English' },
    { id: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
    { id: 'hi', name: 'हिन्दी', label: 'Hindi' },
  ] as const;

  const profileImg = user?.profileImage || `https://picsum.photos/seed/${user?.uid}/40/40`;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-primary font-bold">
            <Zap className="h-5 w-5 fill-primary" />
            <span className="tracking-tight text-sm uppercase">Smart Charge+</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-9 w-9 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center p-0"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-foreground" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center gap-1 px-4">
                <Globe className="h-3 w-3" />
                {languages.find(l => l.id === language)?.name || 'Language'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white min-w-[150px] rounded-xl shadow-2xl backdrop-blur-md">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.id} 
                  onClick={() => setLanguage(lang.id)}
                  className="flex items-center justify-between cursor-pointer focus:bg-primary/20 focus:text-primary transition-colors py-2"
                >
                  <span className="text-sm">{lang.name}</span>
                  {language === lang.id && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 p-0 overflow-hidden" asChild>
             <Link href={user ? "/dashboard" : "/login"}>
                {user ? (
                  <Avatar className="h-full w-full">
                    <AvatarImage src={profileImg} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-4 w-4" />
                )}
             </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center px-8 md:px-20 overflow-hidden border-b border-white/5">
        {/* Dynamic Background Image */}
        {mounted && t?.hero?.backgroundImage ? (
          <div className="absolute inset-0 -z-10 bg-background">
            <Image 
              src={t.hero.backgroundImage}
              alt="Hero Background"
              fill
              className="object-cover opacity-70 saturate-[1.1]"
              priority
              unoptimized={true}
              data-ai-hint="ev station"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-background/10" />
          </div>
        ) : (
          <div className="absolute inset-0 -z-10 bg-background" />
        )}

        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
            {t?.hero?.title}
          </h1>
          <p className="text-white/80 text-xl max-w-lg leading-relaxed drop-shadow-lg font-medium">
            {t?.hero?.subtitle}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-xl h-14 text-base shadow-2xl shadow-primary/30"
              asChild
            >
              <Link href="/stations">{t?.hero?.findStation}</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-black/20 hover:bg-black/40 border-white/20 text-white font-black px-8 rounded-xl h-14 text-base backdrop-blur-md transition-all"
              asChild
            >
              <Link href={user ? "/dashboard" : "/login"}>
                {user ? "Dashboard" : t?.hero?.goDashboard}
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-8 md:px-20 bg-background">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold tracking-tight">{t?.howItWorks?.title}</h2>
          <p className="text-muted-foreground">{t?.howItWorks?.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: MapPin,
              title: t?.howItWorks?.find,
              desc: t?.howItWorks?.findDesc
            },
            {
              icon: Clock,
              title: t?.howItWorks?.book,
              desc: t?.howItWorks?.bookDesc
            },
            {
              icon: Zap,
              title: t?.howItWorks?.charge,
              desc: t?.howItWorks?.chargeDesc
            }
          ].map((step, i) => (
            <div key={i} className="dark-glass p-8 rounded-2xl space-y-6 text-center group hover:bg-accent transition-all">
              <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Choose Your Portal Section */}
      <section className="py-24 px-8 md:px-20 bg-background border-t border-border">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold tracking-tight">{t?.portals?.title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: MapPin,
              title: t?.portals?.driver,
              desc: t?.portals?.driverDesc
            },
            {
              icon: Zap,
              title: t?.portals?.operator,
              desc: t?.portals?.operatorDesc
            },
            {
              icon: Shield,
              title: t?.portals?.admin,
              desc: t?.portals?.adminDesc
            }
          ].map((portal, i) => (
            <Link href="/login" key={i} className="dark-glass p-8 rounded-2xl space-y-6 group hover:bg-accent transition-all cursor-pointer block">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <portal.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                  {portal.title} <ChevronRight className="h-4 w-4" />
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{portal.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 md:px-20 border-t border-border flex flex-col md:flex-row items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-widest bg-background">
        <div className="flex items-center gap-2">
          < Zap className="h-3 w-3 fill-primary/40 text-primary/40" />
          <span>Smart Charge+ © 2026</span>
        </div>
        <div className="mt-4 md:mt-0">
          Smart EV Charging Management
        </div>
      </footer>
    </div>
  );
}
