"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { 
  Wallet, 
  Navigation, 
  Sparkles, 
  History, 
  MapPin, 
  Zap, 
  Search, 
  SlidersHorizontal, 
  BellOff, 
  Star, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  LocateFixed,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { smartChargingStationRecommendation } from '@/ai/flows/smart-charging-station-recommendation-flow';
import { useToast } from '@/hooks/use-toast';
import { Station } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';

export function UserDashboard() {
  const { user, stations, chargers, transactions, t } = useApp();
  const { toast } = useToast();
  const [loadingAi, setLoadingAi] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Booking Dialog State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [dateInput, setDateInput] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [bookingTime, setBookingTime] = useState('15:30');
  const [bookingDuration, setBookingDuration] = useState('1');

  // Initialize and get live location
  useEffect(() => {
    const today = new Date();
    setBookingDate(today);
    setDateInput(format(today, 'yyyy-MM-dd'));
    handleGetLocation(false); // Silent check on mount
  }, []);

  const handleGetLocation = (showToast = true) => {
    if (!("geolocation" in navigator)) {
      if (showToast) {
        toast({ 
          variant: "destructive", 
          title: "Browser Unsupported", 
          description: "Your browser does not support geolocation services." 
        });
      }
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
        if (showToast) {
          toast({ 
            title: "Location Traced", 
            description: "Successfully updated your live position. Nearby stations refreshed." 
          });
        }
      },
      (error) => {
        setLocating(false);
        console.warn("Geolocation error:", error.message);
        if (showToast) {
          toast({ 
            variant: "destructive", 
            title: "Location Access Denied", 
            description: "Please enable location services to find nearby stations." 
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Sync dateInput when bookingDate changes via calendar
  useEffect(() => {
    if (bookingDate) {
      setDateInput(format(bookingDate, 'yyyy-MM-dd'));
    }
  }, [bookingDate]);

  const nearbyStations = useMemo(() => {
    if (!userLocation) return [];
    
    return stations
      .map(station => ({
        ...station,
        distance: calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          station.lat, 
          station.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [stations, userLocation]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateInput(val);
    const parsed = parse(val, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) {
      setBookingDate(parsed);
    }
  };

  const getAiRecommendations = async () => {
    setLoadingAi(true);
    try {
      const available = stations.map(s => {
        const stationChargers = chargers.filter(c => c.station_id === s.station_id);
        const occupied = stationChargers.filter(c => c.status === 'occupied').length;
        const total = stationChargers.length;
        const load = total > 0 ? (occupied / total) * 100 : 0;
        
        return {
          station_id: s.station_id,
          name: s.name,
          location: s.location,
          charger_types: ['Level 2', 'DCFC'] as ('Level 2' | 'DCFC')[],
          current_load_percentage: load,
          rate_per_kwh: stationChargers[0]?.rate_per_kwh || 0.35
        };
      });

      const res = await smartChargingStationRecommendation({
        userLocation: userLocation 
          ? { latitude: userLocation.lat, longitude: userLocation.lng }
          : { latitude: 40.7128, longitude: -74.0060 },
        vehicleChargerType: 'DCFC',
        preference: 'maximizeSpeed',
        availableStations: available
      });
      setRecommendations(res.recommendations);
      toast({ title: "AI Recommendations Ready", description: "Found the best stations for your current trip." });
    } catch (e) {
      console.error("AI Error:", e);
      toast({ title: "AI Error", description: "Could not generate recommendations.", variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenBooking = (station: Station) => {
    setSelectedStation(station);
    setIsBookingOpen(true);
    const stationChargers = chargers.filter(c => c.station_id === station.station_id);
    const firstAvailable = stationChargers.find(c => c.status === 'available');
    if (firstAvailable) setSelectedChargerId(firstAvailable.charger_id);
  };

  const handleConfirmBooking = () => {
    if (!selectedChargerId) {
      toast({ title: "Error", description: "Please select a charger slot.", variant: "destructive" });
      return;
    }
    toast({ 
      title: "Booking Confirmed!", 
      description: `Reserved ${selectedStation?.name} for ${bookingDuration} hour(s) on ${bookingDate ? format(bookingDate, 'PPP') : 'selected date'} at ${bookingTime}.` 
    });
    setIsBookingOpen(false);
  };

  const getEstimatedCost = () => {
    if (!selectedStation) return "0.00";
    const charger = chargers.find(c => c.charger_id === selectedChargerId);
    const rate = charger?.rate_per_kwh || 0.45;
    const durationHours = parseInt(bookingDuration);
    const avgConsumption = charger?.type === 'DCFC' ? 40 : 7;
    return (rate * avgConsumption * durationHours).toFixed(2);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.dashboard.welcomeUser}</h1>
          <p className="text-muted-foreground text-sm">{t.dashboard.ecoSystem}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2 bg-secondary/20 border-white/5">
            <History className="h-4 w-4" /> History
          </Button>
          <Button size="sm" className="teal-gradient-btn font-bold">
            <Wallet className="h-4 w-4" /> Top Up
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t.dashboard.wallet} value={`$${user?.wallet_balance?.toFixed(2) || '0.00'}`} icon={Wallet} />
        <StatCard title={t.dashboard.lastSession} value="45.2 kWh" subtext="Downtown Hub" icon={Zap} />
        <StatCard title={t.dashboard.nearbyActive} value={stations.filter(s => s.status === 'active').length} icon={Navigation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Near Station Suggestion */}
          <Card className="border-none bg-[#1a1a1c] border-white/5 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LocateFixed className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Near Station Suggestion</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground/60">Trace available stations relative to your live position</CardDescription>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleGetLocation()}
                  disabled={locating}
                  className="bg-primary/20 text-primary hover:bg-primary/30 font-bold border border-primary/20 gap-2"
                >
                  {locating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Tracing...
                    </>
                  ) : (
                    "Find Near Station"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userLocation ? (
                  nearbyStations.map((station) => (
                    <div 
                      key={station.station_id} 
                      className="bg-background/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-background/60 transition-colors group cursor-pointer"
                      onClick={() => handleOpenBooking(station)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-secondary/30 rounded-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{station.name}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{station.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{station.distance.toFixed(1)} km</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] px-2 font-bold hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBooking(station);
                          }}
                        >
                          Quick Book
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 space-y-3">
                    <LocateFixed className="h-8 w-8 mx-auto text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Click "Find Near Station" to grant location access and trace your distance to available hubs.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Smart Recommendation */}
          <Card className="border-none bg-[#1a1a1c] border-white/5 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" /> Smart Recommendation
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/60">AI-powered optimal station matching</CardDescription>
                </div>
                <Button
                  onClick={getAiRecommendations}
                  disabled={loadingAi}
                  size="sm"
                  className="bg-primary/20 text-primary hover:bg-primary/30 font-bold border border-primary/20"
                >
                  {loadingAi ? "Analyzing..." : "Find Best Station"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => {
                    const station = stations.find(s => s.station_id === rec.station_id);
                    return (
                      <div 
                        key={i} 
                        className="bg-background/40 p-5 rounded-2xl border border-white/5 flex gap-4 items-start hover:bg-background/60 transition-colors cursor-pointer"
                        onClick={() => station && handleOpenBooking(station)}
                      >
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/10">
                          <Navigation className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{rec.station_name}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-1">{rec.reason}</p>
                          <div className="flex gap-3 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs px-4 rounded-lg bg-white/5 border-white/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Directions
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 text-xs px-4 font-bold rounded-lg teal-gradient-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (station) handleOpenBooking(station);
                              }}
                            >
                              Reserve Spot
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Get personalized AI suggestions for your current trip.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Discover and Book available Chargers nearby</h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search stations..." 
                    className="pl-11 h-12 bg-[#1a1a1c] border-none rounded-xl focus-visible:ring-primary/40 placeholder:text-muted-foreground/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="secondary" className="h-12 bg-[#1a1a1c] hover:bg-[#252528] rounded-xl border-none px-6 text-muted-foreground gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  All Types
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredStations.length > 0 ? (
                filteredStations.map(station => {
                  const stationChargers = chargers.filter(c => c.station_id === station.station_id);
                  const availableCount = stationChargers.filter(c => c.status === 'available').length;
                  const totalCount = stationChargers.length;
                  const rate = stationChargers[0]?.rate_per_kwh || 0.35;
                  
                  return (
                    <Card 
                      key={station.station_id} 
                      className="border-none bg-[#111113] hover:bg-[#151517] transition-all rounded-2xl overflow-hidden group border border-white/5 cursor-pointer"
                      onClick={() => handleOpenBooking(station)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{station.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" /> {station.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="bg-secondary/40 p-1.5 rounded-full">
                                <BellOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                             </div>
                             <div className="flex items-center gap-1 bg-secondary/40 px-2 py-1 rounded-full text-[10px] font-bold">
                                <Star className="h-3 w-3 text-white fill-white" />
                                <span>5</span>
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="flex items-center gap-2 text-sm">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{availableCount}/{totalCount} available</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">${rate.toFixed(2)}/kWh</span>
                           </div>
                        </div>

                        <div className="flex gap-2 mb-6">
                          <Badge variant="secondary" className="bg-[#1c1c1f] text-[10px] py-1 px-3 rounded-lg border-none hover:bg-[#1c1c1f]">CCS</Badge>
                          <Badge variant="secondary" className="bg-[#1c1c1f] text-[10px] py-1 px-3 rounded-lg border-none hover:bg-[#1c1c1f]">Type 2</Badge>
                        </div>

                        <Button 
                          type="button"
                          className="w-full teal-gradient-btn h-12 font-bold rounded-xl shadow-lg shadow-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBooking(station);
                          }}
                        >
                          Book Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                  No stations matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-[#1a1a1c] border-white/5 rounded-2xl overflow-hidden">
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
                        <p className="text-sm font-mono font-bold text-foreground">${tx.cost.toFixed(2)}</p>
                        <p className="text-[10px] text-primary/80 font-bold">{tx.energy_delivered} kWh</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-muted-foreground">
                    No charging sessions yet.
                  </div>
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
                <DialogTitle className="text-xl font-bold text-foreground">{selectedStation?.name}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">{selectedStation?.location}</DialogDescription>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        if (charger.status === 'available') setSelectedChargerId(charger.charger_id);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer group",
                        selectedChargerId === charger.charger_id 
                          ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                          : "bg-background/20 border-white/5 hover:border-white/10",
                        charger.status === 'occupied' && "opacity-50 cursor-not-allowed grayscale"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={cn("h-4 w-4", selectedChargerId === charger.charger_id ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-bold text-foreground">Slot {idx + 1}</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-medium">{charger.type} - {charger.type === 'DCFC' ? '50kW' : '22kW'}</p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          charger.status === 'available' ? "text-primary" : "text-destructive"
                        )}>
                          {charger.status}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" /> Date selection
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative group">
                      <Input
                        value={dateInput}
                        onChange={handleDateInputChange}
                        placeholder="YYYY-MM-DD"
                        className="h-12 w-full pr-10 bg-background/20 border-white/5 rounded-xl hover:bg-white/5 focus:ring-primary/20 text-sm placeholder:text-muted-foreground/30"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCalendarOpen(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-white/5"
                      >
                         <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[320px] p-0 bg-[#1a1a1c] border-white/10 overflow-hidden shadow-2xl" 
                    align="start"
                    onInteractOutside={(e) => {
                      if (e.target instanceof Element && e.target.closest('.rdp')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="bg-[#333] p-6 text-white border-b border-white/5">
                      <p className="text-xs font-semibold opacity-60 tracking-widest uppercase">
                        {bookingDate ? format(bookingDate, "yyyy") : format(new Date(), "yyyy")}
                      </p>
                      <h3 className="text-3xl font-bold mt-1">
                        {bookingDate ? format(bookingDate, "EEE, d MMM") : format(new Date(), "EEE, d MMM")}
                      </h3>
                    </div>
                    <div className="p-2">
                      <Calendar
                        mode="single"
                        selected={bookingDate}
                        onSelect={(date) => {
                          if (date) {
                            setBookingDate(date);
                          }
                        }}
                        initialFocus
                        className="bg-transparent"
                      />
                    </div>
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/5 font-bold uppercase text-[10px] tracking-widest" 
                        onClick={() => { 
                          setBookingDate(undefined);
                          setDateInput('');
                        }}
                      >
                        Clear
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          className="text-white hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest" 
                          onClick={() => setIsCalendarOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary/5 font-bold uppercase text-[10px] tracking-widest" 
                          onClick={() => setIsCalendarOpen(false)}
                        >
                          Set
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Time selection
                </label>
                <Popover open={isTimePickerOpen} onOpenChange={setIsTimePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-12 w-full justify-start text-left font-normal bg-background/20 border-white/5 rounded-xl hover:bg-white/5 focus:ring-primary/20",
                        !bookingTime && "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                         <span>{bookingTime}</span>
                         <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 bg-[#1a1a1c] border-white/10 overflow-hidden shadow-2xl" align="end">
                    <div className="bg-[#333] p-4 text-white border-b border-white/5">
                      <h3 className="text-xl font-bold">Pick Start Time</h3>
                    </div>
                    <div className="p-3 max-h-[300px] overflow-y-auto scrollbar-none">
                      <div className="grid grid-cols-3 gap-2">
                        {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => { 
                              e.stopPropagation();
                              setBookingTime(time); 
                              setIsTimePickerOpen(false); 
                            }}
                            className={cn(
                              "h-10 text-xs rounded-lg border-white/5 bg-white/5 hover:bg-primary/20",
                              bookingTime === time ? "bg-primary text-white border-primary" : "text-muted-foreground"
                            )}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Duration</label>
              <Select value={bookingDuration} onValueChange={setBookingDuration}>
                <SelectTrigger className="h-11 bg-background/20 border-white/5 rounded-xl focus:ring-primary/20">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-background/20 rounded-2xl p-5 flex items-center justify-between border border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-widest">Estimated Cost</p>
                <p className="text-xs text-muted-foreground">Based on avg 50kW consumption</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${getEstimatedCost()}</p>
              </div>
            </div>

            <Button 
              type="button"
              onClick={handleConfirmBooking}
              className="w-full teal-gradient-btn h-12 font-bold rounded-xl shadow-xl shadow-primary/20"
            >
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}