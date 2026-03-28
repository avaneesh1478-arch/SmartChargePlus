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
  Star, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  LocateFixed,
  Loader2,
  Navigation2
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

  useEffect(() => {
    const today = new Date();
    setBookingDate(today);
    setDateInput(format(today, 'yyyy-MM-dd'));
  }, []);

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

  useEffect(() => {
    if (bookingDate) setDateInput(format(bookingDate, 'yyyy-MM-dd'));
  }, [bookingDate]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateInput(val);
    const parsed = parse(val, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) setBookingDate(parsed);
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
      description: `Reserved ${selectedStation?.name} for ${bookingDuration} hour(s) at ${bookingTime}.` 
    });
    setIsBookingOpen(false);
  };

  const getEstimatedCost = () => {
    if (!selectedStation) return "0.00";
    const charger = chargers.find(c => c.charger_id === selectedChargerId);
    const rate = charger?.rate_per_kwh || 0.45;
    return (rate * (charger?.type === 'DCFC' ? 40 : 7) * parseInt(bookingDuration)).toFixed(2);
  };

  const renderStationCard = (station: any, isAi = false) => (
    <Card 
      key={station.station_id} 
      className="border-none bg-[#1a1a1c] hover:bg-[#1e1e20] transition-all rounded-[2rem] relative overflow-hidden group border border-white/5"
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

        {/* Action Buttons */}
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
          {/* AI Recommendations Section */}
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
                recommendations.map(rec => renderStationCard(rec, true))
              ) : (
                <Card className="md:col-span-2 border-dashed border-white/10 bg-white/2 py-10 text-center">
                  <p className="text-sm text-muted-foreground">Click "Refresh AI" for personalized station suggestions.</p>
                </Card>
              )}
            </div>
          </section>

          {/* Nearby Search Section */}
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
                        <p className="text-sm font-mono font-bold text-foreground">${tx.cost.toFixed(2)}</p>
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
                      onClick={() => charger.status === 'available' && setSelectedChargerId(charger.charger_id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer",
                        selectedChargerId === charger.charger_id 
                          ? "bg-primary/10 border-primary" 
                          : "bg-background/20 border-white/5 hover:border-white/10",
                        charger.status === 'occupied' && "opacity-50 cursor-not-allowed"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative group">
                      <Input
                        value={dateInput}
                        onChange={handleDateInputChange}
                        className="h-11 bg-background/20 border-white/5 rounded-xl text-sm"
                      />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1.5 h-8 w-8"><ChevronDown className="h-4 w-4 opacity-50" /></Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1a1a1c] border-white/10" align="start">
                    <div className="bg-[#333] p-4 text-white border-b border-white/5">
                      <p className="text-xs opacity-60 uppercase">{bookingDate ? format(bookingDate, "yyyy") : "---"}</p>
                      <h3 className="text-2xl font-bold">{bookingDate ? format(bookingDate, "EEE, d MMM") : "Select Date"}</h3>
                    </div>
                    <Calendar mode="single" selected={bookingDate} onSelect={setBookingDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Time</label>
                <Popover open={isTimePickerOpen} onOpenChange={setIsTimePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 w-full justify-between bg-background/20 border-white/5 rounded-xl">
                      <span>{bookingTime}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2 bg-[#1a1a1c] border-white/10" align="end">
                    <div className="grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                      {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                        <Button key={time} variant="ghost" size="sm" onClick={() => { setBookingTime(time); setIsTimePickerOpen(false); }} className="text-xs">{time}</Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Duration (Hours)</label>
              <Select value={bookingDuration} onValueChange={setBookingDuration}>
                <SelectTrigger className="h-11 bg-background/20 border-white/5 rounded-xl">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-background/20 rounded-2xl p-4 flex items-center justify-between border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimated Cost</p>
              <p className="text-xl font-bold">${getEstimatedCost()}</p>
            </div>

            <Button onClick={handleConfirmBooking} className="w-full teal-gradient-btn h-12 font-bold rounded-xl">Confirm Booking</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
