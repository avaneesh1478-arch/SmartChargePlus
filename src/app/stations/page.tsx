
"use client";

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/hooks/use-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Map as MapIcon, Grid, Plus, MapPin, Zap, LocateFixed, Navigation, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance } from '@/lib/utils';
import { Station } from '@/types';

export default function StationsPage() {
  const { stations, user } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

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
          description: "Please enable location services to trace your position on the map." 
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleGetDirections = (station: Station) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please trace your live location first to generate accurate directions.",
        variant: "destructive"
      });
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const filteredStations = useMemo(() => {
    return stations
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(s => ({
        ...s,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) : null
      }))
      .sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance;
        return 0;
      });
  }, [stations, searchQuery, userLocation]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Station Network</h1>
            <p className="text-muted-foreground text-sm">Real-time status and live location tracing of infrastructure.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTraceLocation}
              disabled={locating}
              className="bg-secondary/20 border-white/5 font-bold gap-2"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4 text-primary" />}
              Trace My Location
            </Button>
            {user?.role === 'ADMIN' && (
              <Button size="sm" className="bg-primary teal-gradient-btn font-bold">
                <Plus className="h-4 w-4 mr-1" /> Add Station
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none bg-card/50 min-h-[500px] overflow-hidden relative rounded-2xl">
             <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center">
                <div className="text-center z-10 p-8 dark-glass rounded-3xl border-white/10 max-w-md shadow-2xl">
                   <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <MapIcon className="h-8 w-8 text-primary" />
                   </div>
                   <h3 className="text-2xl font-bold mb-3">Live Interactive Map</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                     Visualizing {filteredStations.length} active hubs. {userLocation ? 'Your live position is currently being traced.' : 'Trace your location to see distances and get directions.'}
                   </p>
                   {selectedStation ? (
                     <div className="bg-background/40 p-4 rounded-xl border border-primary/20 text-left mb-6">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Target Station</p>
                        <h4 className="font-bold">{selectedStation.name}</h4>
                        <p className="text-xs text-muted-foreground">{selectedStation.location}</p>
                        <Button 
                          className="w-full mt-4 teal-gradient-btn font-bold gap-2 h-10"
                          onClick={() => handleGetDirections(selectedStation)}
                        >
                          <Navigation className="h-4 w-4" /> Start Navigation
                        </Button>
                     </div>
                   ) : (
                    <p className="text-xs text-muted-foreground italic mb-6">Select a station from the list to view on map</p>
                   )}
                   <div className="flex gap-3 justify-center">
                    <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">Standard</Button>
                    <Button variant="outline" className="border-primary/50 text-primary bg-primary/5">Satellite</Button>
                   </div>
                </div>
                <Image
                  src="https://picsum.photos/seed/ev-map-dark/1200/800"
                  alt="Network Map"
                  fill
                  className="object-cover opacity-20 saturate-0"
                  data-ai-hint="dark map"
                />
                {/* Simulated Pins */}
                <div className="absolute top-1/3 left-1/4 h-4 w-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.8)]" />
                <div className="absolute top-1/2 left-1/2 h-4 w-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.8)]" />
                <div className="absolute bottom-1/4 right-1/3 h-4 w-4 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
             </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Station List</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filter..." 
                  className="pl-8 h-8 w-[120px] bg-secondary/50 border-none text-xs" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 scrollbar-none">
              {filteredStations.map(station => (
                <Card 
                  key={station.station_id} 
                  onClick={() => setSelectedStation(station)}
                  className={`border-none transition-all cursor-pointer rounded-2xl overflow-hidden ${selectedStation?.station_id === station.station_id ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-secondary/30 hover:bg-secondary/50'}`}
                >
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/50 shrink-0">
                        <Zap className={station.status === 'active' ? 'text-primary' : 'text-muted-foreground'} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">{station.name}</h4>
                          <Badge variant="outline" className={station.status === 'active' ? 'success-badge text-[10px] py-0' : 'warning-badge text-[10px] py-0'}>
                            {station.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {station.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        <span>{station.charger_count} Slots</span>
                        {station.distance && <span className="text-primary">{station.distance.toFixed(1)} km away</span>}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-[10px] font-bold gap-1 text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(station);
                        }}
                      >
                        <Navigation className="h-3 w-3" /> Route
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredStations.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                  No matching stations found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
