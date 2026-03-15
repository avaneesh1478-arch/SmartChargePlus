
"use client";

import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Zap, Globe, User } from 'lucide-react';
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
          {/* Logo matches image style */}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-xs bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center gap-1">
            <Globe className="h-3 w-3" />
            English
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <User className="h-4 w-4" />
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
          <div className="flex items-center gap-2 text-primary font-bold">
            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="tracking-tight text-lg">SmartCharge+</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Smarter <br />
            <span className="text-primary">EV Charging</span> <br />
            Starts Here
          </h1>

          <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
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

        {/* Scroll Indicator / Footer segment */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight opacity-90">How It Works</h2>
            <div className="h-1 w-24 bg-primary/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* Floating App Badge Simulation (matches image bottom right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] text-white/50 shadow-2xl">
          <span>Edit with</span>
          <div className="flex items-center gap-1 font-bold text-white/90">
             <div className="w-2 h-2 rounded-full bg-rose-500" /> Lovable
          </div>
          <button className="ml-1 hover:text-white">×</button>
        </div>
      </div>
    </div>
  );
}
