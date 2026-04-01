"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { 
  IndianRupee, 
  Navigation, 
  Sparkles, 
  History, 
  MapPin, 
  Zap, 
  Search, 
  Star, 
  Clock, 
  X,
  LocateFixed,
  Loader2,
  Navigation2,
  CheckCircle2,
  Coffee,
  Wifi,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { smartChargingStationRecommendation } from '@/ai/flows/smart-charging-station-recommendation-flow';
import { useToast } from '@/hooks/use-toast';
import { Station } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';
import Image from 'next/image';

export function UserDashboard() {
  const { user, stations, chargers, transactions, t } = useApp();
  const { toast } = useToast();
  
  // UI States
  const [loadingAi, setLoadingAi] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Booking Dialog State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBookingPending, setIsBookingPending] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const [bookingDuration, setBookingDuration] = useState('1');

  // Details Dialog State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsStation, setDetailsStation] = useState<Station | null>(null);

  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({ variant: "destructive", title: "Unsupported", description: "Browser does not support geolocation." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
        toast({ title: "Location Updated", description: "Tracing your nearby stations..." });
      },
      () => {
        setLocating(false);
        toast({ variant: "destructive", title: "Error", description: "Could not access location." });
      }
    );
  };

  const handleGetDirections = (station: Station) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : "Current+Location";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const getAiRecommendations = async () => {
    setLoadingAi(true);
    try {
      const available = stations.map(s => {
        const stationChargers = chargers.filter(c => c.station_id === s.station_id);
        const occupied = stationChargers.filter(c => c.status === 'occupied').length;
        const total = stationChargers.length;
        return {
          station_id: s.station_id,
          name: s.name,
          location: s.location,
          charger_types: ['Level 2', 'DCFC'] as ('Level 2' | 'DCFC')[],
          current_load_percentage: total > 0 ? (occupied / total) * 100 : 0,
          rate_per_kwh: stationChargers[0]?.rate_per_kwh || 15.00
        };
      });

      const res = await smartChargingStationRecommendation({
        userLocation: userLocation 
          ? { latitude: userLocation.lat, longitude: userLocation.lng }
          : { latitude: 12.9716, longitude: 77.5946 },
        vehicleChargerType: 'DCFC',
        preference: 'maximizeSpeed',
        availableStations: available
      });
      setRecommendations(res.recommendations);
      toast({ title: "AI Recommendations Ready", description: "Found the best stations for your current trip." });
    } catch (e) {
      toast({ title: "AI Error", description: "Could not generate recommendations.", variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  const filteredStations = useMemo(() => {
    return stations
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.location.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(s => ({
        ...s,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) : null
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [stations, searchQuery, userLocation]);

  const handleOpenBooking = (station: Station) => {
    setSelectedStation(station);
    const stationChargers = chargers.filter(c => c.station_id === station.station_id);
    const firstAvailable = stationChargers.find(c => c.status === 'available');
    if (firstAvailable) {
      setSelectedChargerId(firstAvailable.charger_id);
    } else {
      setSelectedChargerId(null);
    }
    setIsBookingOpen(true);
  };

  const handleOpenDetails = (station: Station) => {
    setDetailsStation(station);
    setIsDetailsOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedChargerId) {
      toast({ title: "No Slots Available", description: "This station is currently fully occupied. Please select another station.", variant: "destructive" });
      return;
    }
    
    setIsBookingPending(true);
    
    // Simulate API delay
    setTimeout(() => {
      toast({ 
        title: "Booking Confirmed!", 
        description: `Reserved ${selectedStation?.name} for ${bookingDuration} hour(s) starting now.` 
      });
      setIsBookingPending(false);
      setIsBookingOpen(false);
    }, 800);
  };

  const getEstimatedCost = () => {
    if (!selectedStation || !selectedChargerId) return "0.00";
    const charger = chargers.find(c => c.charger_id === selectedChargerId);
    const rate = charger?.rate_per_kwh || 15.00;
    const duration = parseInt(bookingDuration) || 1;
    // Basic estimation logic
    const energyEstimate = charger?.type === 'DCFC' ? 40 : 7;
    return (rate * energyEstimate * duration).toFixed(2);
  };

  const renderStationCard = (station: any, isAi = false) => (
    <Card 
      key={station.station_id} 
      className="border-none bg-[#1a1a1c] hover:bg-[#1e1e20] transition-all rounded-[2rem] relative overflow-hidden group border border-white/5"
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[#252528] flex items-center justify-center shrink-0 border border-white/5">
            <Zap className="h-6 w-6 text-muted-foreground/60" />
          </div>

          <div className="flex-1 min-w-0 relative">
            <div className="absolute top-0 right-0">
              <Badge className="bg-[#1e2a27] text-[#4ade80] border-none px-3 py-1 rounded-full font-bold text-[11px]">
                {station.distance ? `${station.distance.toFixed(1)} km` : '---'}
              </Badge>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-lg text-white truncate pr-16">{station.name || station.station_name}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium truncate">
                <MapPin className="h-3 w-3" /> {station.location || 'Network Station'}
              </p>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#4ade80]">
              <Star className="h-3.5 w-3.5 fill-[#4ade80]" /> 4.5
            </div>
            
            {isAi && station.reason && (
              <p className="mt-2 text-[10px] text-primary font-medium italic line-clamp-1">"{station.reason}"</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#3b82f6]/50 text-[#60a5fa] hover:bg-[#3b82f6]/10 rounded-xl h-10 font-bold text-xs"
            onClick={() => handleOpenBooking(station as Station)}
          >
            Book Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#10b981]/50 text-[#34d399] hover:bg-[#10b981]/10 rounded-xl h-10 font-bold text-xs"
            onClick={() => handleOpenDetails(station as Station)}
          >
            Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#10b981]/50 text-[#34d399] hover:bg-[#10b981]/10 rounded-xl h-10 font-bold text-xs gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections(station as Station);
            }}
          >
            <Navigation2 className="h-3.5 w-3.5" /> Trace
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.dashboard.welcomeUser}</h1>
          <p className="text-muted-foreground text-sm">{t.dashboard.ecoSystem}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2 bg-secondary/20 border-white/5 h-10 px-4">
            <History className="h-4 w-4" /> History
          </Button>
          <Button size="sm" className="teal-gradient-btn font-bold h-10 px-6">
            <IndianRupee className="h-4 w-4" /> Top Up
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t.dashboard.wallet} value={`₹${user?.wallet_balance?.toFixed(2) || '0.00'}`} icon={IndianRupee} />
        <StatCard title={t.dashboard.lastSession} value="45.2 kWh" subtext="Downtown Hub" icon={Zap} />
        <StatCard title={t.dashboard.nearbyActive} value={stations.filter(s => s.status === 'active').length} icon={Navigation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary fill-primary/20" /> Smart Recommendations
              </h3>
              <Button 
                onClick={getAiRecommendations} 
                disabled={loadingAi}
                variant="ghost" 
                size="sm" 
                className="text-primary hover:bg-primary/5 font-bold"
              >
                {loadingAi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Refresh AI
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.length > 0 ? (
                recommendations.map(rec => {
                  const fullStation = stations.find(s => s.station_id === rec.station_id);
                  return renderStationCard(fullStation || rec, true);
                })
              ) : (
                <Card className="md:col-span-2 border-dashed border-white/10 bg-white/2 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Click "Refresh AI" for personalized station suggestions.</p>
                </Card>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold">Discover & Book Nearby</h3>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleGetLocation} 
                  disabled={locating}
                  variant="outline" 
                  size="sm" 
                  className="bg-indigo-600/10 border-indigo-500/20 text-indigo-500 hover:bg-indigo-600 hover:text-white rounded-full px-4 h-9 font-bold"
                >
                  {locating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <LocateFixed className="h-3 w-3 mr-2" />}
                  Trace Location
                </Button>
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search stations or cities..." 
                className="h-12 pl-12 bg-[#1a1a1c] border-white/5 rounded-xl focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStations.map(station => renderStationCard(station))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-[#1a1a1c] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <History className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <div key={tx.transaction_id} className="p-5 flex gap-4 items-center hover:bg-white/5 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{tx.station_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                          {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-foreground">₹{tx.cost.toFixed(2)}</p>
                        <p className="text-[10px] text-primary/80 font-bold">{tx.energy_delivered} kWh</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-muted-foreground">No charging sessions yet.</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-white/5 bg-secondary/5">
              <Button variant="ghost" className="w-full text-xs h-9 hover:bg-primary/5 text-primary">View Full History</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1c] border-white/5 text-white p-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">{selectedStation?.name || 'Book Station'}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">{selectedStation?.location || 'Select booking options below'}</DialogDescription>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/5 text-muted-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60">Select a Charger</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedStation && chargers
                  .filter(c => c.station_id === selectedStation.station_id)
                  .map((charger, idx) => (
                    <div 
                      key={charger.charger_id}
                      onClick={() => {
                        if (charger.status === 'available') {
                          setSelectedChargerId(charger.charger_id);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer",
                        selectedChargerId === charger.charger_id 
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                          : "bg-background/20 border-white/5 hover:border-white/10",
                        charger.status === 'occupied' && "opacity-50 cursor-not-allowed grayscale"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={cn("h-4 w-4", selectedChargerId === charger.charger_id ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-bold">Slot {idx + 1}</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-medium">{charger.type}</p>
                        <p className={cn("text-[10px] font-bold uppercase", charger.status === 'available' ? "text-primary" : "text-destructive")}>{charger.status}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Duration (Hours)</label>
              <Select value={bookingDuration} onValueChange={setBookingDuration}>
                <SelectTrigger className="h-11 bg-background/20 border-white/5 rounded-xl focus:ring-primary/20">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-background/20 rounded-2xl p-4 flex items-center justify-between border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Estimated Cost</p>
              <p className="text-xl font-bold text-primary">₹{getEstimatedCost()}</p>
            </div>

            <Button 
              onClick={handleConfirmBooking} 
              disabled={isBookingPending || !selectedChargerId}
              className="w-full teal-gradient-btn h-12 font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isBookingPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] bg-[#1a1a1c] border-white/5 text-white p-0 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          {detailsStation && (
            <div className="flex flex-col">
              {/* Header Visual */}
              <div className="relative h-64 w-full">
                <Image 
                  src={detailsStation.images?.[0] || 'https://picsum.photos/seed/ev-station/800/450'}
                  alt={detailsStation.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent" />
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10">
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </div>

              <div className="px-8 pb-8 -mt-12 relative z-10 space-y-8">
                {/* Station Identification */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-4xl font-black tracking-tight">{detailsStation.name}</DialogTitle>
                    <Badge className="success-badge px-3 py-1 font-bold text-[10px] tracking-widest uppercase">Active</Badge>
                  </div>
                  <DialogDescription className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {detailsStation.location}
                  </DialogDescription>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {/* Services Section */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">Available Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {detailsStation.services && detailsStation.services.length > 0 ? (
                          detailsStation.services.map((service, i) => (
                            <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-white rounded-xl py-2 px-4 flex items-center gap-2">
                              {service.toLowerCase().includes('wifi') && <Wifi className="h-3 w-3 text-primary" />}
                              {service.toLowerCase().includes('cafe') && <Coffee className="h-3 w-3 text-primary" />}
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Standard network services provided.</p>
                        )}
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">Site Features</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {detailsStation.features && detailsStation.features.length > 0 ? (
                          detailsStation.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-medium text-white/80">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              {feature}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic">24/7 access available.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <Card className="bg-black/20 border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Network Stats</h4>
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Zap className="h-4 w-4 text-primary" />
                               </div>
                               <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Power</span>
                            </div>
                            <span className="text-lg font-black">{detailsStation.total_power} kW</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Clock className="h-4 w-4 text-primary" />
                               </div>
                               <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Avg. Uptime</span>
                            </div>
                            <span className="text-lg font-black text-emerald-500">99.9%</span>
                         </div>
                       </div>
                    </div>
                    
                    <Button 
                      className="w-full teal-gradient-btn mt-8 font-bold rounded-2xl h-12"
                      onClick={() => {
                        setIsDetailsOpen(false);
                        handleOpenBooking(detailsStation);
                      }}
                    >
                      Reserve A Slot Now
                    </Button>
                  </Card>
                </div>

                {/* Gallery */}
                {detailsStation.images && detailsStation.images.length > 1 && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">Gallery</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {detailsStation.images.slice(1, 4).map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 group">
                          <Image 
                            src={img} 
                            alt={`Gallery ${i}`} 
                            fill 
                            className="object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
