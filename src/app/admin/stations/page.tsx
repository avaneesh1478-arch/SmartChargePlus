
"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Search, 
  Zap, 
  Calendar, 
  Clock, 
  Eye, 
  ShieldCheck,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Station, Booking } from '@/types';
import { format } from 'date-fns';

export default function AdminStationsPage() {
  const { user, stations, bookings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter stations based on search
  const filteredStations = useMemo(() => {
    return stations.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stations, searchQuery]);

  // Get bookings for the selected station
  const stationBookings = useMemo(() => {
    if (!selectedStation) return [];
    return bookings
      .filter(b => b.stationId === selectedStation.station_id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, selectedStation]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <ShieldCheck className="h-12 w-12 text-muted-foreground/20" />
           <p className="text-muted-foreground">Unauthorized access. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleOpenDetails = (station: Station) => {
    setSelectedStation(station);
    setIsDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <LayoutGrid className="h-7 w-7 text-primary" /> Network Infrastructure
            </h1>
            <p className="text-muted-foreground text-sm">Monitor all charging hubs and their associated booking activities.</p>
          </div>
          <Badge variant="outline" className="h-10 px-4 success-badge flex items-center gap-2">
            <Zap className="h-4 w-4" /> {stations.length} Registered Hubs
          </Badge>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search stations by name or location..." 
            className="h-12 pl-12 bg-[#1a1a1c] border-white/5 rounded-xl focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStations.map((station) => (
            <Card 
              key={station.station_id} 
              className="border-none bg-[#1a1a1c] border-white/5 hover:bg-[#1f1f22] transition-all group cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => handleOpenDetails(station)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={station.status === 'active' ? 'default' : 'secondary'} className={station.status === 'active' ? 'success-badge text-[10px] uppercase' : 'text-[10px] uppercase'}>
                    {station.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                  {station.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" /> {station.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Power</p>
                    <p className="text-sm font-bold">{station.total_power} kW</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Connectors</p>
                    <p className="text-sm font-bold">{station.charger_count} Slots</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-primary font-bold text-xs">
                  <span>View Activity Log</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[800px] bg-[#1a1a1c] border-white/5 text-white max-h-[85vh] overflow-y-auto rounded-3xl p-0 overflow-hidden">
            {selectedStation && (
              <div className="flex flex-col">
                <div className="bg-gradient-to-br from-primary/20 to-secondary/10 p-8 border-b border-white/5">
                  <DialogHeader>
                    <div className="flex items-center gap-4 mb-4">
                       <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                          <Zap className="h-8 w-8 text-white fill-white" />
                       </div>
                       <div>
                         <DialogTitle className="text-2xl font-black tracking-tight">{selectedStation.name}</DialogTitle>
                         <DialogDescription className="text-muted-foreground flex items-center gap-2 mt-1">
                           <MapPin className="h-4 w-4 text-primary" /> {selectedStation.location}
                         </DialogDescription>
                       </div>
                    </div>
                  </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Station Booking History</h3>
                    <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/5 hover:bg-transparent bg-white/5">
                            <TableHead className="text-[10px] font-bold uppercase py-4">User ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase py-4">Date</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase py-4">Time</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase py-4">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase py-4 text-right">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stationBookings.length > 0 ? (
                            stationBookings.map((bk) => (
                              <TableRow key={bk.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="py-4 font-mono text-xs">{bk.userId.substring(0, 8)}...</TableCell>
                                <TableCell className="py-4 text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {bk.bookingDate}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    {bk.bookingTime}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge 
                                    variant={bk.status === 'confirmed' ? 'default' : bk.status === 'pending' ? 'secondary' : 'destructive'} 
                                    className="text-[10px] uppercase tracking-wider font-bold"
                                  >
                                    {bk.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 text-right text-[10px] text-muted-foreground">
                                  {format(new Date(bk.createdAt), 'MMM d, HH:mm')}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">
                                No booking activity recorded for this station yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-white/5 border-white/5 p-6 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lifetime Bookings</p>
                        <p className="text-2xl font-black">{stationBookings.length}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                    </Card>
                    <Card className="bg-white/5 border-white/5 p-6 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Requests</p>
                        <p className="text-2xl font-black text-amber-500">{stationBookings.filter(b => b.status === 'pending').length}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-500" />
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 flex justify-end">
                  <Button variant="ghost" onClick={() => setIsDetailsOpen(false)} className="font-bold">
                    Close Management View
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
