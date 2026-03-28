"use client";

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/hooks/use-store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Map as MapIcon, Zap, LocateFixed, Navigation, Loader2, Star, Crosshair, Navigation2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance, cn } from '@/lib/utils';
import { Station } from '@/types';

export default function StationsPage() {
  const { stations, user, chargers } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'dcfc'>('all');

  const handleTraceLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({ 
        variant: "destructive", 
        title: "Unsupported", 
        description: "Browser does not support geolocation." 
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocating(false);
        toast({ 
          title: "Location Traced", 
          description: "Your live position is now synchronized with the station network." 
        });
      },
      (error) => {
        setLocating(false);
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "Please enable location services to trace your position." 
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleGetDirections = (station: Station) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : "Current+Location";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const filteredStations = useMemo(() => {
    return stations
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.location.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeFilter === 'dcfc') {
          const stationChargers = chargers.filter(c => c.station_id === s.station_id);
          return matchesSearch && stationChargers.some(c => c.type === 'DCFC');
        }
        
        return matchesSearch;
      })
      .map(s => ({
        ...s,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) : null
      }))
      .sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance;
        return 0;
      });
  }, [stations, searchQuery, userLocation, activeFilter, chargers]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-2">
              Smart Search
              <Badge className="bg-emerald-500/20 text-emerald-500 border-none rounded-full h-6 px-3 flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                <LocateFixed className="h-3 w-3" /> Nearby Sorting
              </Badge>
            </h1>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search stations or cities..." 
              className="h-14 pl-12 bg-[#1a1a1c] border-white/5 rounded-2xl text-base focus-visible:ring-primary/40 placeholder:text-muted-foreground/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant={userLocation ? "default" : "outline"} 
              size="sm" 
              onClick={handleTraceLocation}
              disabled={locating}
              className={cn(
                "rounded-full px-6 font-bold h-10 gap-2",
                userLocation ? "bg-indigo-600 hover:bg-indigo-700 text-white border-none" : "bg-white/5 border-white/10 text-white"
              )}
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {userLocation ? "Nearby: ON" : "Nearby: OFF"}
            </Button>
            <Button 
              variant={activeFilter === 'all' ? "secondary" : "ghost"}
              onClick={() => setActiveFilter('all')}
              className={cn("rounded-full px-6 h-10 font-bold", activeFilter === 'all' ? "bg-white/10" : "text-muted-foreground")}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === 'dcfc' ? "secondary" : "ghost"}
              onClick={() => setActiveFilter('dcfc')}
              className={cn("rounded-full px-6 h-10 font-bold", activeFilter === 'dcfc' ? "bg-white/10" : "text-muted-foreground")}
            >
              DC Fast
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Station List */}
          <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 scrollbar-none">
            {filteredStations.map(station => (
              <Card 
                key={station.station_id} 
                className={cn(
                  "border-none bg-[#1a1a1c] hover:bg-[#1e1e20] transition-all rounded-[2rem] relative overflow-hidden group border border-white/5",
                  selectedStation?.station_id === station.station_id && "ring-2 ring-primary/40"
                )}
                onClick={() => setSelectedStation(station)}
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Icon Box */}
                    <div className="h-16 w-16 rounded-2xl bg-[#252528] flex items-center justify-center shrink-0 border border-white/5">
                      <Zap className="h-6 w-6 text-muted-foreground/60" />
                    </div>

                    <div className="flex-1 min-w-0 relative">
                      {/* Distance Badge top right */}
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-[#1e2a27] text-[#4ade80] border-none px-3 py-1 rounded-full font-bold text-[11px]">
                          {station.distance ? `${station.distance.toFixed(1)} km` : '---'}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-lg text-white truncate pr-16">{station.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium truncate">
                          <MapPin className="h-3 w-3" /> {station.location}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#4ade80]">
                        <Star className="h-3.5 w-3.5 fill-[#4ade80]" /> 4.5
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-[#3b82f6]/50 text-[#60a5fa] hover:bg-[#3b82f6]/10 rounded-xl h-10 font-bold text-xs"
                    >
                      Book Now
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-[#10b981]/50 text-[#34d399] hover:bg-[#10b981]/10 rounded-xl h-10 font-bold text-xs"
                    >
                      Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-[#10b981]/50 text-[#34d399] hover:bg-[#10b981]/10 rounded-xl h-10 font-bold text-xs gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(station);
                      }}
                    >
                      <Navigation2 className="h-3.5 w-3.5" /> Trace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation Center */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card className="border-none bg-[#1a1a1c] min-h-[500px] overflow-hidden relative rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center border border-white/5">
               {/* Decorative Background Grid */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
               
               <div className="text-center z-10 p-10 space-y-8">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-30" />
                    <div className="relative bg-[#111113] w-24 h-24 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-xl">
                      <MapIcon className="h-10 w-10 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight uppercase text-muted-foreground/40">Navigation Center</h3>
                    <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                      Select a charging station from the list and click Trace to start your real-time journey guidance.
                    </p>
                  </div>
               </div>

               {/* Live Tracking Banner */}
               <div className="mt-auto w-full p-6">
                 <div className="bg-[#111113]/80 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col items-center gap-4 shadow-2xl">
                    <div className="flex items-center gap-4 w-full">
                       <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <LocateFixed className="h-6 w-6 text-emerald-500 animate-pulse" />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-black text-white uppercase tracking-widest">Live Tracking Active</p>
                          <p className="text-[10px] text-muted-foreground font-medium">Signal: High Precision (0.5m accuracy)</p>
                       </div>
                    </div>
                    
                    {userLocation ? (
                      <div className="bg-black/40 px-6 py-2 rounded-full border border-white/5 font-mono text-[10px] text-primary/80 font-bold">
                        {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                      </div>
                    ) : (
                      <Badge variant="outline" className="border-dashed border-white/20 text-[10px] uppercase font-bold text-muted-foreground/40 px-4">
                        GPS Offline
                      </Badge>
                    )}
                 </div>
               </div>

               <Image
                 src="https://picsum.photos/seed/ev-map-dark/1200/800"
                 alt="Network Map"
                 fill
                 className="object-cover opacity-[0.03] saturate-0 pointer-events-none"
                 data-ai-hint="dark map"
               />
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
