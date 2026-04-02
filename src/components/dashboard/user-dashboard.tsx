
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
  Calendar as CalendarIcon,
  AlertCircle
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { smartChargingStationRecommendation } from '@/ai/flows/smart-charging-station-recommendation-flow';
import { useToast } from '@/hooks/use-toast';
import { Station, Booking } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function UserDashboard() {
  const { stations, chargers, transactions, t } = useApp();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("08:00");

  // Availability Check
  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);
  
  const availabilityQuery = useMemoFirebase(() => {
    if (!db || !selectedStation || !dateStr || !selectedTime) return null;
    return query(
      collection(db, "bookings"),
      where("stationId", "==", selectedStation.station_id),
      where("bookingDate", "==", dateStr),
      where("bookingTime", "==", selectedTime),
      where("status", "in", ["pending", "confirmed"])
    );
  }, [db, selectedStation, dateStr, selectedTime]);

  const { data: conflicts, isLoading: isValidating } = useCollection(availabilityQuery);
  const isUnavailable = conflicts && conflicts.length > 0;

  // Fetch My Bookings
  const myBookingsQuery = useMemoFirebase(() => {
    if (!db || !firebaseUser) return null;
    return query(
      collection(db, "bookings"),
      where("userId", "==", firebaseUser.uid)
    );
  }, [db, firebaseUser]);

  const { data: myBookings } = useCollection<Booking>(myBookingsQuery);

  // Time slots generation
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

  const handleConfirmBooking = async () => {
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

    try {
      await setDoc(doc(db, "bookings", bookingId), bookingData);
      toast({ 
        title: "Request Sent", 
        description: `Booking for ${dateStr} at ${selectedTime} is awaiting operator approval.` 
      });
      setIsBookingOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit booking request.", variant: "destructive" });
    } finally {
      setIsBookingPending(false);
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
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-[#3b82f6]/50 text-[#60a5fa] hover:bg-[#3b82f6]/10 rounded-xl h-10 font-bold text-xs"
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

      {/* Booking Dialog */}
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
    </div>
  );
}
