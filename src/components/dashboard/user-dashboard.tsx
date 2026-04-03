"use client";

import { useState, useMemo, useEffect } from 'react';
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
  Coffee
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { Station, Booking } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

export function UserDashboard() {
  const { stations, t } = useApp();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBookingPending, setIsBookingPending] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("08:00");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsStation, setDetailsStation] = useState<Station | null>(null);

  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);
  
  const availabilityQuery = useMemoFirebase(() => {
    if (!db || !selectedStation || !dateStr || !selectedTime || !firebaseUser) return null;
    return query(
      collection(db, "bookings"),
      where("stationId", "==", selectedStation.station_id),
      where("bookingDate", "==", dateStr),
      where("bookingTime", "==", selectedTime),
      where("status", "in", ["pending", "confirmed"])
    );
  }, [db, selectedStation, dateStr, selectedTime, firebaseUser]);

  const { data: conflicts, isLoading: isValidating } = useCollection(availabilityQuery);
  const isUnavailable = conflicts && conflicts.length > 0;

  const myBookingsQuery = useMemoFirebase(() => {
    if (!db || !firebaseUser) return null;
    return query(
      collection(db, "bookings"),
      where("userId", "==", firebaseUser.uid)
    );
  }, [db, firebaseUser]);

  const { data: myBookings } = useCollection<Booking>(myBookingsQuery);

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
    if (!firebaseUser || !selectedStation || !db) return;
    
    setIsBookingPending(true);
    const bookingId = `bk-${Date.now()}`;
    const bookingData: Booking = {
      id: bookingId,
      userId: firebaseUser.uid,
      stationId: selectedStation.station_id,
      operatorId: selectedStation.operator_id,
      stationName: selectedStation.name,
      bookingDate: dateStr,
      bookingTime: selectedTime,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const docRef = doc(db, "bookings", bookingId);
    setDoc(docRef, bookingData)
      .then(() => {
        toast({ 
          title: "Request Sent", 
          description: `Booking for ${dateStr} at ${selectedTime} is awaiting operator approval.` 
        });
        setIsBookingOpen(false);
        setIsBookingPending(false);
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: bookingData,
        });
        errorEmitter.emit('permission-error', contextualError);
        setIsBookingPending(false);
      });
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
      className="border-none bg-[#111113] hover:bg-[#161618] transition-all rounded-[1.5rem] relative overflow-hidden group border border-white/5"
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-2xl bg-[#1c1c1f] flex items-center justify-center shrink-0 border border-white/5">
            <Zap className="h-8 w-8 text-muted-foreground/40" />
          </div>

          <div className="flex-1 min-w-0 relative">
            <div className="absolute top-0 right-0">
              <Badge className="bg-[#1e2a27]/40 text-[#4ade80] border-none px-3 py-1 rounded-full font-bold text-[11px] tracking-tight">
                {station.distance ? `${station.distance.toFixed(1)} km` : '---'}
              </Badge>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-xl text-white truncate pr-16 tracking-tight">{station.name}</h4>
              <p className="text-sm text-muted-foreground/60 flex items-center gap-1.5 font-medium truncate">
                <MapPin className="h-3.5 w-3.5" /> {station.location}
              </p>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#4ade80]">
              <Star className="h-4 w-4 fill-[#4ade80]" /> 4.5
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#3b82f6]/40 text-[#60a5fa] hover:bg-[#3b82f6]/10 rounded-xl h-11 font-bold text-sm"
            onClick={() => {
              setSelectedStation(station);
              setIsBookingOpen(true);
            }}
          >
            Book Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#10b981]/40 text-[#34d399] hover:bg-[#10b981]/10 rounded-xl h-11 font-bold text-sm"
            onClick={() => handleOpenDetails(station)}
          >
            Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#10b981]/40 text-[#34d399] hover:bg-[#10b981]/10 rounded-xl h-11 font-bold text-sm gap-2"
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
          <Button size="sm" className="teal-gradient-btn font-bold h-10 px-6">
            <IndianRupee className="h-4 w-4" /> Top Up
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t.dashboard.wallet} value={`₹${firebaseUser ? '150.00' : '0.00'}`} icon={IndianRupee} />
        <StatCard title="Confirmed Bookings" value={myBookings?.filter(b => b.status === 'confirmed').length || 0} icon={CheckCircle2} />
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
              <CardDescription className="sr-only">Your recent charging session history.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {myBookings && myBookings.length > 0 ? (
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
        <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground p-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Request Slot: {selectedStation?.name}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Choose your preferred time for charging.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-11 justify-start text-left font-normal bg-secondary/30 border-none rounded-xl">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date < new Date() || date > addDays(new Date(), 7)}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Time</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="h-11 bg-secondary/30 border-none rounded-xl focus:ring-primary/20">
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

            {isValidating && (
              <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" /> Validating slot availability...
              </div>
            )}

            {isUnavailable && !isValidating && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-500 font-bold">This slot is currently unavailable. Please select another time.</p>
              </div>
            )}

            {!isUnavailable && !isValidating && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-500 font-bold">This slot is available for booking.</p>
              </div>
            )}

            <Button 
              onClick={handleConfirmBooking} 
              disabled={isBookingPending || isUnavailable || isValidating}
              className="w-full teal-gradient-btn h-12 font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              {isBookingPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Request Booking"}
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