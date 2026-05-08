"use client";

import { useApp } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/60 backdrop-blur-md">
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
      <section className="relative h-screen flex flex-col justify-center px-8 md:px-20 overflow-hidden">
        {/* Dynamic Background Image */}
        <div className="absolute inset-0 -z-10 bg-black">
          {t?.hero?.backgroundImage && (
            <Image 
              src={t.hero.backgroundImage}
              alt="Hero Background"
              fill
              className={`object-cover opacity-100 saturate-[1.1] brightness-[0.8] transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              priority
              unoptimized={true}
              data-ai-hint="ev station"
            />
          )}
          {/* Multi-layered gradient for text readability - optimized for visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/10" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 font-bold text-[10px] uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-4 duration-700">
              Sustainable Infrastructure
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none drop-shadow-2xl animate-in fade-in slide-in-from-left-6 duration-1000">
              {t?.hero?.title}
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-xl leading-relaxed drop-shadow-lg font-medium animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
              {t?.hero?.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 rounded-xl h-14 text-base shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
              asChild
            >
              <Link href="/stations">{t?.hero?.findStation}</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white/5 hover:bg-white/10 border-white/20 text-white font-bold px-10 rounded-xl h-14 text-base backdrop-blur-md transition-all shadow-xl"
              asChild
            >
              <Link href={user ? "/dashboard" : "/login"}>
                {user ? "Dashboard" : t?.hero?.goDashboard}
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-12 left-8 md:left-20 flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
           <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             99.9% Uptime
           </div>
           <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             Ultra Fast DC
           </div>
        </div>

        <div className="absolute top-1/2 right-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-8 md:px-20 bg-background relative border-t border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-primary/50 to-transparent" />
        
        <div className="text-center space-y-4 mb-24">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{t?.howItWorks?.title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t?.howItWorks?.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
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
          ].map((step, i) => (step && (
            <div key={i} className="relative group">
              <div className="dark-glass p-10 rounded-3xl space-y-8 text-center transition-all duration-500 hover:translate-y-[-8px] hover:bg-white/[0.03] hover:border-primary/30 h-full flex flex-col items-center">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                  <step.icon className="h-8 w-8 transition-transform group-hover:scale-110" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
              {i < 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 -translate-y-1/2">
                   <ChevronRight className="h-8 w-8 text-primary/20" />
                </div>
              )}
            </div>
          )))}
        </div>
      </section>

      {/* Choose Your Portal Section */}
      <section className="py-32 px-8 md:px-20 bg-[#0a0a0c] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        
        <div className="text-center space-y-4 mb-24">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{t?.portals?.title}</h2>
          <p className="text-muted-foreground text-lg">Integrated tools for every stakeholder in the network.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: User,
              title: t?.portals?.driver,
              desc: t?.portals?.driverDesc,
              color: 'from-emerald-500/20'
            },
            {
              icon: Zap,
              title: t?.portals?.operator,
              desc: t?.portals?.operatorDesc,
              color: 'from-primary/20'
            },
            {
              icon: Shield,
              title: t?.portals?.admin,
              desc: t?.portals?.adminDesc,
              color: 'from-blue-500/20'
            }
          ].map((portal, i) => (
            <Link href="/login" key={i} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-3xl -z-10" />
              <div className="dark-glass p-10 rounded-3xl space-y-8 group-hover:border-primary/50 transition-all duration-500 h-full flex flex-col cursor-pointer border border-white/5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.color} to-transparent flex items-center justify-center border border-white/10`}>
                  <portal.icon className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-4 flex-1">
                  <h3 className="text-2xl font-black flex items-center gap-2 group-hover:text-primary transition-colors">
                    {portal.title} <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{portal.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 md:px-20 border-t border-white/5 flex flex-col md:row items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-[0.3em] bg-background">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 fill-primary/40 text-primary/40" />
          <span className="font-black text-white/40">Smart Charge+ © 2026</span>
        </div>
        <div className="mt-6 md:mt-0 flex gap-8">
           <Link href="#" className="hover:text-primary transition-colors">Infrastructure</Link>
           <Link href="#" className="hover:text-primary transition-colors">Network Map</Link>
           <Link href="#" className="hover:text-primary transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  );
}
