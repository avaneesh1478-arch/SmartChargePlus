"use client";

import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Zap, Globe, User, MapPin, Clock, Shield, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const { user } = useApp();
  const router = useRouter();

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex items-center gap-1 text-primary font-bold">
            <Zap className="h-5 w-5 fill-primary" />
            <span className="tracking-tight text-sm">Smart Charge+</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-xs bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center gap-1">
            <Globe className="h-3 w-3" />
            English
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10" asChild>
             <Link href={user ? "/dashboard" : "/login"}>
                <User className="h-4 w-4" />
             </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center px-8 md:px-20 overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage?.imageUrl || 'https://picsum.photos/seed/ev-night/1920/1080'}
            alt="Hero Background"
            fill
            className="object-cover opacity-60"
            priority
            data-ai-hint="ev charging night"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
            Real-time station availability, advance booking, and intelligent management — all in one platform.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-xl h-12 shadow-xl shadow-primary/20"
              asChild
            >
              <Link href="/stations">Find a Station</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border-white/10 text-white font-bold px-8 rounded-xl h-12"
              asChild
            >
              <Link href={user ? "/dashboard" : "/login"}>
                {user ? "Go to Dashboard" : "Sign In"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-8 md:px-20 bg-black">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold tracking-tight">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to smarter charging</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: MapPin,
              title: "Find",
              desc: "Search nearby charging stations with real-time availability"
            },
            {
              icon: Clock,
              title: "Book",
              desc: "Reserve your slot in advance to skip the wait"
            },
            {
              icon: Zap,
              title: "Charge",
              desc: "Plug in and charge — track your session in real time"
            }
          ].map((step, i) => (
            <div key={i} className="dark-glass p-8 rounded-2xl border-white/5 space-y-6 text-center group hover:bg-white/5 transition-all">
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
      <section className="py-24 px-8 md:px-20 bg-black border-t border-white/5">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold tracking-tight">Choose Your Portal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: MapPin,
              title: "EV Driver",
              desc: "Find stations, book slots, and charge your vehicle effortlessly."
            },
            {
              icon: Zap,
              title: "Station Operator",
              desc: "Manage your charging stations, slots, and track earnings."
            },
            {
              icon: Shield,
              title: "System Admin",
              desc: "Monitor the entire network, validate operators, and view analytics."
            }
          ].map((portal, i) => (
            <Link href="/login" key={i} className="dark-glass p-8 rounded-2xl border-white/5 space-y-6 group hover:bg-white/5 transition-all cursor-pointer block">
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
      <footer className="py-8 px-8 md:px-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] text-muted-foreground/60 uppercase tracking-widest bg-black">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 fill-primary/40 text-primary/40" />
          <span>Smart Charge+ © 2026</span>
        </div>
        <div className="mt-4 md:mt-0">
          Smart EV Charging Management
        </div>
      </footer>
    </div>
  );
}
