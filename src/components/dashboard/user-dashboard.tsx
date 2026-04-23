
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { Station, Booking, Review } from '@/types';
import { cn, calculateDistance } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function UserDashboard() {
  const { stations, chargers, t, user: appUser, bookings, addBooking, addReview } = useApp();
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

  // Review Dialog State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewStation, setReviewStation] = useState<Station | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Receipt Dialog State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Monitor Rejections for Refunds
  const prevBookingsRef = useRef<Booking[]>([]);
  useEffect(() => {
    if (!appUser) return;
    
    const myBookings = bookings.filter(b => b.userId === appUser.uid);
    
    myBookings.forEach(current => {
      const previous = prevBookingsRef.current.find(p => p.id === current.id);
      if (previous && previous.status === 'pending' && current.status === 'rejected') {
        toast({
          title: "Booking Rejected",
          description: `₹${current.amount?.toFixed(2)} has been credited back to your wallet.`,
        });
      }
    });
    
    prevBookingsRef.current = myBookings;
  }, [bookings, appUser, toast]);

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

  // Robust overlap validation for particular slots
  const isUnavailable = useMemo(() => {
    if (!selectedStation || !selectedChargerId) return false;
    
    // Convert current selection to timestamps for comparison
    const newStartStr = `${dateStr}T${selectedTime}`;
    const newStartTime = new Date(newStartStr).getTime();
    const newEndTime = newStartTime + (parseInt(duration) * 60 * 60 * 1000);

    return bookings.some(b => {
      // Must be the same slot at the same station
      if (b.stationId !== selectedStation.station_id || b.chargerId !== selectedChargerId) return false;
      
      // Only worry about active/confirmed bookings
      if (!['pending', 'confirmed'].includes(b.status)) return false;

      // Use pre-calculated timestamps if available
      if (b.startTime && b.endTime) {
        return (newStartTime < b.endTime) && (b.startTime < newEndTime);
      }
      
      // Fallback for simple date checks if timestamps missing
      return b.bookingDate === dateStr && b.bookingTime === selectedTime;
    });
  }, [bookings, selectedStation, selectedChargerId, dateStr, selectedTime, duration]);

  const activeBookings = useMemo(() => {
    if (!appUser) return [];
    return bookings
      .filter(b => b.userId === appUser.uid && ['pending', 'confirmed'].includes(b.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [bookings, appUser]);

  const pastBookings = useMemo(() => {
    if (!appUser) return [];
    return bookings
      .filter(b => b.userId === appUser.uid && ['completed', 'rejected', 'failed_insufficient_funds'].includes(b.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, appUser]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let h = 8; h <= 22; h++) {
      const hh = h.toString().padStart(2, '0');
      
      // Only allow slots that are in the future relative to system time
      if (!isToday || h > currentHour) {
        slots.push(`${hh}:00`);
      }

      if (!isToday || h > currentHour || (h === currentHour && currentMinute < 30)) {
        slots.push(`${hh}:30`);
      }
    }
    return slots;
  }, [selectedDate]);

  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
      setSelectedTime(timeSlots[0]);
    }
  }, [timeSlots, selectedTime]);

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

  const handleOpenReview = (stationId: string) => {
    const station = stations.find(s => s.station_id === stationId);
    if (station) {
      setReviewStation(station);
      setRating(5);
      setComment('');
      setIsReviewOpen(true);
    }
  };

  const handleOpenReceipt = (booking: Booking) => {
    setReceiptBooking(booking);
    setIsReceiptOpen(true);
  };

  const handleDownloadReceipt = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      toast({
        title: "Receipt Downloaded",
        description: "Your session invoice has been saved to your gallery.",
      });
    }, 1500);
  };

  const handleSubmitReview = () => {
    if (!appUser || !reviewStation) return;
    
    addReview({
      stationId: reviewStation.station_id,
      userId: appUser.uid,
      userName: appUser.fullName || appUser.email.split('@')[0],
      rating,
      comment
    });

    toast({
      title: "Review Submitted",
      description: "Thank you for your feedback! It helps others in the community.",
    });
    setIsReviewOpen(false);
  };

  const handleConfirmBooking = () => {
    if (!appUser || !selectedStation || !selectedChargerId) return;
    
    if ((appUser.wallet_balance || 0) < estimatedCost) {
      toast({
        variant: "destructive",
        title: "Insufficient Credits",
        description: "Please top up your wallet to book this slot.",
      });
      return;
    }

    setIsBookingPending(true);
    
    setTimeout(() => {
      const bookingId = `bk-${Date.now()}`;
      const startTime = new Date(`${dateStr}T${selectedTime}`).getTime();
      const durationMs = parseInt(duration) * 60 * 60 * 1000;

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
        amount: estimatedCost,
        createdAt: new Date().toISOString(),
        startTime,
        endTime: startTime + durationMs
      };

      addBooking(newBooking);
      
      toast({ 
        title: "Request Sent", 
        description: `₹${estimatedCost.toFixed(2)} has been escrowed. Awaiting operator approval.` 
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

  const incrementDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const decrementDay = () => {
    const nextDate = subDays(selectedDate, 1);
    if (nextDate >= new Date(new Date().setHours(0,0,0,0))) {
      setSelectedDate(nextDate);
    }
  };

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
        <StatCard title="Confirmed Bookings" value={activeBookings.filter(b => b.status === 'confirmed').length} icon={CheckCircle2} />
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
                <Clock className="h-5 w-5 text-primary" /> Active Sessions
              </CardTitle>
              <CardDescription>Track your upcoming and live charges.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {activeBookings.length > 0 ? (
                  activeBookings.map(bk => (
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
                        <Badge 
                          variant={bk.status === 'confirmed' ? 'default' : 'secondary'} 
                          className="text-[10px] uppercase"
                        >
                          {bk.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-muted-foreground">No active bookings.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-[#1a1a1c] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <History className="h-5 w-5 text-primary" /> Past Sessions
              </CardTitle>
              <CardDescription>Review your charging history.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {pastBookings.length > 0 ? (
                  pastBookings.map(bk => (
                    <div key={bk.id} className="p-5 space-y-4 hover:bg-white/5 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 rounded-full bg-secondary/40 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{bk.stationName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                            {bk.bookingDate} • Status: <span className={cn(bk.status === 'completed' ? 'text-emerald-500' : 'text-rose-500')}>{bk.status}</span>
                          </p>
                        </div>
                      </div>
                      
                      {bk.status === 'completed' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenReceipt(bk)}
                            className="h-8 text-[10px] font-bold uppercase tracking-wider flex-1 bg-white/5 border-white/5 hover:text-primary transition-colors"
                          >
                            <FileText className="h-3 w-3 mr-1.5" /> Receipt
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenReview(bk.stationId)}
                            className="h-8 text-[10px] font-bold uppercase tracking-wider flex-1 bg-white/5 border-white/5 hover:text-primary transition-colors"
                          >
                            <MessageSquare className="h-3 w-3 mr-1.5" /> Review
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-muted-foreground">No past sessions recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#111113] border-white/5 text-white p-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 space-y-8">
            <DialogHeader className="flex flex-row justify-between items-start space-y-0 text-left">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black tracking-tight">{selectedStation?.name}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground/60">{selectedStation?.location}</DialogDescription>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-white bg-white/5 border border-white/5">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Select a Charger</h3>
              <div className="grid grid-cols-2 gap-3">
                {stationChargers.map((charger, i) => (
                  <button
                    key={charger.charger_id}
                    onClick={() => setSelectedChargerId(charger.charger_id)}
                    className={cn(
                      "flex flex-col p-4 rounded-xl border transition-all text-left group",
                      selectedChargerId === charger.charger_id 
                        ? "bg-primary/10 border-primary ring-1 ring-primary/20" 
                        : "bg-[#1c1c1f] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Zap className={cn("h-3 w-3", selectedChargerId === charger.charger_id ? "text-primary fill-primary" : "text-muted-foreground")} />
                        Slot {i + 1}
                      </span>
                      {selectedChargerId === charger.charger_id && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold mb-1">
                      {charger.type} • {charger.type === 'DCFC' ? '150kW' : '22kW'}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
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
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3" /> Date
                </label>
                <div className="flex items-center gap-1 bg-[#1c1c1f] rounded-xl overflow-hidden p-0.5">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-10 justify-between text-left font-bold text-sm bg-transparent hover:bg-white/5 border-none px-4 rounded-lg"
                    onClick={() => {
                      setTempDate(selectedDate);
                      setIsDatePickerOpen(true);
                    }}
                  >
                    <span className="truncate">{format(selectedDate, "MMMM do, yyyy")}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <div className="flex flex-col border-l border-white/5 pr-0.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-8 rounded-md hover:bg-white/10"
                      onClick={incrementDay}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-8 rounded-md hover:bg-white/10"
                      onClick={decrementDay}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Start Time
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="h-11 bg-[#1c1c1f] border-none rounded-xl focus:ring-primary/20 font-bold text-sm">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/10 text-white max-h-[300px]">
                    {timeSlots.length > 0 ? (
                      timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">No available slots today.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11 bg-[#1c1c1f] border-none rounded-xl focus:ring-primary/20 font-bold text-sm">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent className="bg-[#111113] border-white/10 text-white">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-[#1c1c1f] rounded-2xl p-6 flex items-center justify-between border border-white/5">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground/80 font-bold">Estimated Cost</p>
                <p className="text-[10px] text-muted-foreground/40 font-medium">Based on avg {selectedCharger?.type === 'DCFC' ? '50kW' : '7kW'} consumption</p>
              </div>
              <div className="text-3xl font-black text-white">
                ₹{estimatedCost.toFixed(2)}
              </div>
            </div>

            {(isUnavailable || timeSlots.length === 0) && !isBookingPending && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-500 font-bold">
                  {timeSlots.length === 0 
                    ? "No more sessions available for today." 
                    : "This slot is already reserved for the selected time period."}
                </p>
              </div>
            )}

            <Button 
              onClick={handleConfirmBooking} 
              disabled={isBookingPending || isUnavailable || !selectedChargerId || timeSlots.length === 0}
              className="w-full teal-gradient-btn h-14 font-black text-lg rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              {isBookingPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-[360px] p-0 bg-[#1a1a1c] border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Select Date</DialogTitle>
            <DialogDescription>Choose a specific date for your charging session.</DialogDescription>
          </DialogHeader>
          <div className="bg-[#222222] p-8 space-y-1">
            <p className="text-xs font-black text-white/50 tracking-[0.2em] uppercase">{format(tempDate, "yyyy")}</p>
            <p className="text-3xl font-black text-white">{format(tempDate, "EEE, d MMM")}</p>
          </div>
          <div className="p-4 bg-[#1a1a1c]">
             <Calendar
                mode="single"
                selected={tempDate}
                onSelect={(date) => date && setTempDate(date)}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date > addDays(new Date(), 30)}
                initialFocus
                className="rounded-xl w-full"
             />
          </div>
          <div className="p-6 flex items-center justify-end gap-3 bg-[#1a1a1c]">
            <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-xs h-10 px-6" onClick={() => setIsDatePickerOpen(false)}>Cancel</Button>
            <Button 
              variant="ghost" 
              className="text-primary font-black uppercase tracking-widest text-xs h-10 px-8 bg-primary/10 rounded-xl" 
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

      {/* Station Details Dialog */}
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
                        {detailsStation.features && detailsStation.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-medium text-white/80">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {feature}
                          </div>
                        ))}
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

      {/* Review & Rating Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[450px] bg-[#1a1a1c] border-white/5 text-white p-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 space-y-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Star className="h-6 w-6 text-primary fill-primary" /> Station Feedback
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                How was your experience at <strong>{reviewStation?.name}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Your Rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90 hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= rating ? "text-primary fill-primary" : "text-muted-foreground/20"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                <span className="text-lg font-black text-primary">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Awful'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Your Comments</label>
                <Textarea 
                  placeholder="Tell us about the charger speed, station cleanliness, or any issues you encountered..."
                  className="bg-[#1c1c1f] border-none rounded-xl min-h-[120px] focus-visible:ring-primary/20 text-sm placeholder:text-muted-foreground/40"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-3 sm:gap-0">
               <Button variant="ghost" className="flex-1 font-bold rounded-xl" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
               <Button 
                className="flex-1 teal-gradient-btn font-black rounded-xl h-12"
                onClick={handleSubmitReview}
              >
                 Submit Review
               </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Digital Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#111113] border-white/5 text-white p-0 rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
             <DialogTitle>Session Receipt</DialogTitle>
             <DialogDescription>Detailed breakdown of your charging transaction.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 p-8 text-center border-b border-white/5 relative overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
               <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
               <h3 className="text-xl font-black tracking-tight">{receiptBooking?.stationName}</h3>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Charging Session Receipt</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Date</span>
                  <span className="font-bold">{receiptBooking?.bookingDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Booked Time</span>
                  <span className="font-bold">{receiptBooking?.bookingTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Selected Duration</span>
                  <span className="font-bold">{receiptBooking?.duration} Hour(s)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Transaction ID</span>
                  <span className="font-mono text-[10px] bg-white/5 px-2 py-1 rounded">#{receiptBooking?.id.substring(0, 10)}</span>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full border-t border-dashed" />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Base Charge</span>
                  <span className="font-bold text-foreground">₹{receiptBooking?.amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Amount Paid</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">₹{receiptBooking?.amount?.toFixed(2)}</span>
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-emerald-500" />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Status: Paid</p>
                    <p className="text-[9px] text-muted-foreground/60 font-medium mt-1">Processed successfully from your wallet balance.</p>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-secondary/10 flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1 font-bold rounded-xl h-12" 
                onClick={() => setIsReceiptOpen(false)}
              >
                Close
              </Button>
              <Button 
                className="flex-1 teal-gradient-btn font-black rounded-xl h-12 gap-2"
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
