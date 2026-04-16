
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { 
  IndianRupee, 
  Navigation, 
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
  Calendar as CalendarIcon,
  AlertCircle,
  Wifi,
  Coffee,
  Check,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { Station, Booking } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function UserDashboard() {
  const { stations, chargers, t, user: appUser, bookings, addBooking } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBookingPending, setIsBookingPending] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("08:00");
  const [duration, setDuration] = useState<string>("1");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsStation, setDetailsStation] = useState<Station | null>(null);

  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);
  
  const stationChargers = useMemo(() => {
    if (!selectedStation) return [];
    return chargers.filter(c => c.station_id === selectedStation.station_id);
  }, [chargers, selectedStation]);

  const selectedCharger = useMemo(() => {
    return stationChargers.find(c => c.charger_id === selectedChargerId);
  }, [stationChargers, selectedChargerId]);

  const estimatedCost = useMemo(() => {
    if (!selectedCharger) return 0;
    return selectedCharger.rate_per_kwh * parseInt(duration) * (selectedCharger.type === 'DCFC' ? 50 : 7);
  }, [selectedCharger, duration]);

  const isUnavailable = useMemo(() => {
    if (!selectedStation || !selectedChargerId) return false;
    return bookings.some(b => 
      b.stationId === selectedStation.station_id && 
      b.chargerId === selectedChargerId &&
      b.bookingDate === dateStr && 
      b.bookingTime === selectedTime && 
      ['pending', 'confirmed'].includes(b.status)
    );
  }, [bookings, selectedStation, selectedChargerId, dateStr, selectedTime]);

  const myBookings = useMemo(() => {
    if (!appUser) return [];
    return bookings.filter(b => b.userId === appUser.uid);
  }, [bookings, appUser]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 22; h++) {
      const hh = h.toString().padStart(2, '0');
      slots.push(`${hh}:00`, `${hh}:30`);
    }
    return slots;
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

  const handleOpenDetails = (station: Station) => {
    setDetailsStation(station);
    setIsDetailsOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!appUser || !selectedStation || !selectedChargerId) return;
    
    setIsBookingPending(true);
    
    setTimeout(() => {
      const bookingId = `bk-${Date.now()}`;
      const newBooking: Booking = {
        id: bookingId,
        userId: appUser.uid,
        stationId: selectedStation.station_id,
        operatorId: selectedStation.operator_id,
        stationName: selectedStation.name,
        chargerId: selectedChargerId,
        bookingDate: dateStr,
        bookingTime: selectedTime,
        duration: parseInt(duration),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      addBooking(newBooking);
      
      toast({ 
        title: "Request Sent", 
        description: `Booking for ${dateStr} at ${selectedTime} is awaiting operator approval.` 
      });
      setIsBookingOpen(false);
      setIsBookingPending(false);
    }, 500);
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

  const renderStationCard = (station: Station) => (
    <Card 
      key={station.station_id} 
      className="border-none bg-[#111113] hover:bg-[#161618] transition-all rounded-[1.5rem] relative overflow-hidden group border border-white/5 shadow-lg"
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-2xl bg-[#1c1c1f] flex items-center justify-center shrink-0 border border-white/5">
            <Zap className="h-8 w-8 text-primary/60" />
          </div>

          <div className="flex-1 min-w-0 relative">
            <div className="absolute top-0 right-0">
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-full font-bold text-[11px] tracking-tight">
                {station.distance ? `${station.distance.toFixed(1)} km` : '---'}
              </Badge>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-xl text-white truncate pr-16 tracking-tight">{station.name}</h4>
              <p className="text-sm text-muted-foreground/60 flex items-center gap-1.5 font-medium truncate">
                <MapPin className="h-3.5 w-3.5 text-primary/40" /> {station.location}
              </p>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-400">
              <Star className="h-4 w-4 fill-emerald-400" /> 4.8
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 rounded-xl h-11 font-bold text-sm"
            onClick={() => {
              setSelectedStation(station);
              const available = chargers.find(c => c.station_id === station.station_id && c.status === 'available');
              setSelectedChargerId(available?.charger_id || null);
              setIsBookingOpen(true);
            }}
          >
            Book Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 rounded-xl h-11 font-bold text-sm"
            onClick={() => handleOpenDetails(station)}
          >
            Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 rounded-xl h-11 font-bold text-sm gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections(station);
            }}
          >
            <Navigation2 className="h-4 w-4" /> Trace
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
          <Button 
            size="sm" 
            className="teal-gradient-btn font-bold h-10 px-6"
            onClick={() => router.push('/wallet')}
          >
            <IndianRupee className="h-4 w-4" /> Top Up
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t.dashboard.wallet} value={`₹${appUser?.wallet_balance?.toFixed(2) || '0.00'}`} icon={IndianRupee} />
        <StatCard title="Confirmed Bookings" value={myBookings.filter(b => b.status === 'confirmed').length} icon={CheckCircle2} />
        <StatCard title="Nearby Stations" value={stations.length} icon={Navigation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold">Discover & Book Nearby</h3>
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
                <History className="h-5 w-5 text-primary" /> My Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {myBookings.length > 0 ? (
                  myBookings.map(bk => (
                    <div key={bk.id} className="p-5 flex gap-4 items-center hover:bg-white/5 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{bk.stationName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                          {bk.bookingDate} • {bk.bookingTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={bk.status === 'confirmed' ? 'default' : bk.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                          {bk.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-muted-foreground">No bookings yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#111113] border-white/10 text-white p-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 space-y-8">
            <DialogHeader className="flex flex-row justify-between items-start space-y-0 text-left">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold tracking-tight">{selectedStation?.name}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">{selectedStation?.location}</DialogDescription>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select a Charger</h3>
              <div className="grid grid-cols-2 gap-3">
                {stationChargers.map((charger, i) => (
                  <button
                    key={charger.charger_id}
                    onClick={() => setSelectedChargerId(charger.charger_id)}
                    className={cn(
                      "flex flex-col p-4 rounded-xl border transition-all text-left",
                      selectedChargerId === charger.charger_id 
                        ? "bg-primary/10 border-primary" 
                        : "bg-[#1c1c1f] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        <Zap className={cn("h-3 w-3", selectedChargerId === charger.charger_id ? "text-primary" : "text-muted-foreground")} />
                        Slot {i + 1}
                      </span>
                      {selectedChargerId === charger.charger_id && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      {charger.type} • {charger.type === 'DCFC' ? '150kW' : '22kW'}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      charger.status === 'available' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {charger.status === 'available' ? 'Available' : 'Occupied'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3" /> Date
                </label>
                <Button 
                  variant="outline" 
                  className="w-full h-11 justify-between text-left font-normal bg-[#1c1c1f] border-none rounded-xl"
                  onClick={() => {
                    setTempDate(selectedDate);
                    setIsDatePickerOpen(true);
                  }}
                >
                  <span className="truncate">{format(selectedDate, "PPP")}</span>
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Start Time
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="h-11 bg-[#1c1c1f] border-none rounded-xl focus:ring-primary/20">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-[300px]">
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11 bg-[#1c1c1f] border-none rounded-xl focus:ring-primary/20">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-[#1c1c1f] rounded-2xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Estimated Cost</p>
                <p className="text-[10px] text-muted-foreground/60">Based on avg {selectedCharger?.type === 'DCFC' ? '50kW' : '7kW'} consumption</p>
              </div>
              <div className="text-2xl font-black">
                ₹{estimatedCost.toFixed(2)}
              </div>
            </div>

            {isUnavailable && !isBookingPending && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-500 font-bold">This slot is currently unavailable at this time.</p>
              </div>
            )}

            <Button 
              onClick={handleConfirmBooking} 
              disabled={isBookingPending || isUnavailable || !selectedChargerId}
              className="w-full teal-gradient-btn h-14 font-black text-base rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              {isBookingPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* High Fidelity Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-[360px] p-0 bg-[#1a1a1c] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-[#555555] p-6 space-y-1">
            <DialogTitle className="text-xs font-bold text-white/70 tracking-widest uppercase">{format(tempDate, "yyyy")}</DialogTitle>
            <DialogDescription className="text-3xl font-bold text-white">{format(tempDate, "EEE, d MMM")}</DialogDescription>
          </div>
          <div className="p-2">
             <Calendar
                mode="single"
                selected={tempDate}
                onSelect={(date) => date && setTempDate(date)}
                disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                initialFocus
                className="rounded-xl w-full"
             />
          </div>
          <div className="p-4 flex items-center justify-end gap-2 bg-[#1a1a1c]">
            <Button variant="ghost" className="text-primary font-bold px-6" onClick={() => setIsDatePickerOpen(false)}>Clear</Button>
            <Button variant="ghost" className="text-primary font-bold px-6" onClick={() => setIsDatePickerOpen(false)}>Cancel</Button>
            <Button 
              variant="ghost" 
              className="text-primary font-bold px-6" 
              onClick={() => {
                setSelectedDate(tempDate);
                setIsDatePickerOpen(false);
              }}
            >
              Set
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] bg-[#1a1a1c] border-white/5 text-white p-0 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          {detailsStation && (
            <div className="flex flex-col">
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
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-4xl font-black tracking-tight">{detailsStation.name}</DialogTitle>
                    <Badge className="success-badge px-3 py-1 font-bold text-[10px] tracking-widest uppercase">Active</Badge>
                  </div>
                  <DialogDescription className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {detailsStation.location}
                  </DialogDescription>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
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
                        setSelectedStation(detailsStation);
                        const available = chargers.find(c => c.station_id === detailsStation.station_id && c.status === 'available');
                        setSelectedChargerId(available?.charger_id || null);
                        setIsBookingOpen(true);
                      }}
                    >
                      Book A Slot Now
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
