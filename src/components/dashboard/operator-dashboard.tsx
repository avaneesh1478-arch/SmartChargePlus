
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { 
  IndianRupee, 
  Users, 
  Zap, 
  Activity, 
  Check, 
  X,
  Clock,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Booking } from '@/types';

export function OperatorDashboard() {
  const { stations } = useApp();
  const { user: firebaseUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const myStation = useMemo(() => {
    if (!firebaseUser) return undefined;
    return stations.find(s => s.operator_id === firebaseUser.uid);
  }, [stations, firebaseUser]);

  // Fetch Live Bookings for Operator
  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !firebaseUser) return null;
    return query(
      collection(db, "bookings"),
      where("operatorId", "==", firebaseUser.uid),
      orderBy("bookingDate", "asc"),
      orderBy("bookingTime", "asc")
    );
  }, [db, firebaseUser]);

  const { data: bookings, isLoading: loadingBookings } = useCollection<Booking>(bookingsQuery);

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: newStatus });
      toast({
        title: `Booking ${newStatus === 'confirmed' ? 'Approved' : 'Rejected'}`,
        description: `The customer has been notified of the status change.`,
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update booking status.", variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    if (!bookings) return { confirmed: 0, pending: 0, rejected: 0 };
    return {
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Operator Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage your station bookings and infrastructure.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Revenue (Est)" 
          value="₹19,880" 
          icon={IndianRupee} 
          trend={{ value: 12, isUp: true }} 
          iconClassName="bg-emerald-500/10"
        />
        <StatCard 
          title="Total Requests" 
          value={bookings?.length || 0} 
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
          {loadingBookings && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        
        <Card className="border-none bg-[#1a1a1c] overflow-hidden rounded-2xl border border-white/5">
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
              {bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
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
                    {loadingBookings ? "Connecting to network..." : "No booking requests found for your station."}
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
