
"use client";

import { useMemo } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { 
  IndianRupee, 
  Users, 
  Check, 
  X,
  Clock,
  Calendar as CalendarIcon,
  Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

export function OperatorDashboard() {
  const { user: appUser, bookings, updateBookingStatus, stations, transactions } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  // Identify stations managed by this operator
  const myStations = useMemo(() => {
    if (!appUser) return [];
    return stations.filter(s => 
      s.operator_id === appUser.uid || 
      (appUser.associated_station_id && s.station_id === appUser.associated_station_id)
    );
  }, [stations, appUser]);

  const myStationIds = useMemo(() => myStations.map(s => s.station_id), [myStations]);

  // Calculate real revenue from transactions and bookings
  const realRevenue = useMemo(() => {
    if (!appUser) return 0;
    
    // Revenue from historical transactions
    const transactionRevenue = transactions
      .filter(t => myStationIds.includes(t.station_id))
      .reduce((acc, t) => acc + t.cost, 0);
    
    // Revenue from active or completed bookings (escrowed funds)
    const bookingRevenue = bookings
      .filter(b => myStationIds.includes(b.stationId) && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((acc, b) => acc + (b.amount || 0), 0);
      
    return transactionRevenue + bookingRevenue;
  }, [transactions, bookings, myStationIds, appUser]);

  // Filter local bookings for the operator's stations
  const myBookings = useMemo(() => {
    if (!appUser) return [];
    return bookings
      .filter(b => myStationIds.includes(b.stationId))
      .sort((a, b) => {
        const dateA = new Date(`${a.bookingDate}T${a.bookingTime}`);
        const dateB = new Date(`${b.bookingDate}T${b.bookingTime}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [bookings, myStationIds, appUser]);

  const handleUpdateStatus = (bookingId: string, newStatus: 'confirmed' | 'rejected') => {
    updateBookingStatus(bookingId, newStatus);
    toast({
      title: `Booking ${newStatus === 'confirmed' ? 'Approved' : 'Rejected'}`,
      description: `The customer has been notified of the status change.`,
    });
  };

  const stats = useMemo(() => {
    return {
      confirmed: myBookings.filter(b => b.status === 'confirmed').length,
      pending: myBookings.filter(b => b.status === 'pending').length,
      rejected: myBookings.filter(b => b.status === 'rejected').length,
    };
  }, [myBookings]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operator Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your booking requests and network performance.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/operator/station-details')}
          className="bg-secondary/20 border-white/5 gap-2 font-bold h-10 px-6"
        >
          <Settings className="h-4 w-4 text-primary" /> Manage Station
        </Button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹${realRevenue.toLocaleString()}`} 
          icon={IndianRupee} 
          trend={{ value: 8, isUp: true }} 
          iconClassName="bg-emerald-500/10"
        />
        <StatCard 
          title="Total Requests" 
          value={myBookings.length} 
          icon={Users} 
          iconClassName="bg-primary/10"
        />
        <StatCard 
          title="Confirmed" 
          value={stats.confirmed} 
          subtext="Ready to charge" 
          icon={Check} 
          iconClassName="bg-emerald-500/10"
        />
        <StatCard 
          title="Pending" 
          value={stats.pending} 
          subtext="Action required" 
          icon={Clock} 
          iconClassName="bg-amber-500/10"
        />
      </div>

      {/* Recent Bookings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Network Booking Requests</h3>
        </div>
        
        <Card className="border-none bg-[#1a1a1c] overflow-hidden rounded-2xl border border-white/5">
          <CardHeader className="sr-only">
             <CardTitle>Booking Requests</CardTitle>
             <CardDescription>View and manage slots reserved by users.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-secondary/5">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Station</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Time</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myBookings.length > 0 ? (
                myBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="text-sm font-medium py-4">{booking.stationName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3" /> {booking.bookingDate}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {booking.bookingTime}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      {booking.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white h-8 w-8 p-0"
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white h-8 w-8 p-0"
                            onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground italic">
                    No booking requests found for your station.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
