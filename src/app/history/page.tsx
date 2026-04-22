
"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/stat-card';
import { History, Zap, IndianRupee, Clock, MapPin, Download } from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const { user, transactions, bookings } = useApp();

  // Combine transactions and completed bookings into a unified history list
  const historyItems = useMemo(() => {
    if (!user) return [];

    // 1. Map actual transactions
    const txItems = transactions
      .filter(t => t.user_id === user.uid)
      .map(t => ({
        id: t.transaction_id,
        stationName: t.station_name,
        stationId: t.station_id,
        timestamp: t.timestamp,
        duration: t.duration,
        energy: t.energy_delivered,
        cost: t.cost,
        type: 'transaction' as const
      }));

    // 2. Map completed bookings
    const completedBookings = bookings
      .filter(b => b.userId === user.uid && b.status === 'completed')
      .map(b => ({
        id: b.id,
        stationName: b.stationName,
        stationId: b.stationId,
        timestamp: new Date(b.createdAt).getTime(),
        duration: b.duration ? b.duration * 60 : 0, // convert hours to minutes
        energy: b.duration ? b.duration * (b.chargerId?.includes('dcfc') ? 50 : 7) : 0, // estimated
        cost: b.amount || 0,
        type: 'booking' as const
      }));

    // Combine and sort by newest first
    return [...txItems, ...completedBookings].sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, bookings, user]);

  // Aggregate stats for the user's history
  const stats = useMemo(() => {
    const totalEnergy = historyItems.reduce((acc, t) => acc + t.energy, 0);
    const totalSpent = historyItems.reduce((acc, t) => acc + t.cost, 0);
    const totalSessions = historyItems.length;
    return { totalEnergy, totalSpent, totalSessions };
  }, [historyItems]);

  // Redirect or show unauthorized if not a USER
  if (!user || user.role !== 'USER') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <History className="h-12 w-12 text-muted-foreground/20" />
           <p className="text-muted-foreground">Unauthorized access. This page is for EV Drivers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <History className="h-7 w-7 text-primary" /> Charging History
            </h1>
            <p className="text-muted-foreground text-sm">Review your past charging sessions and expenses across the network.</p>
          </div>
          <Button variant="outline" className="h-10 px-4 bg-secondary/20 border-white/5 gap-2 font-bold hover:bg-secondary/40">
            <Download className="h-4 w-4 text-primary" /> Export History
          </Button>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total Sessions" 
            value={stats.totalSessions} 
            icon={History} 
            iconClassName="bg-blue-500/10"
          />
          <StatCard 
            title="Energy Consumed" 
            value={`${stats.totalEnergy.toLocaleString()} kWh`} 
            icon={Zap} 
            iconClassName="bg-primary/10"
          />
          <StatCard 
            title="Total Lifetime Spent" 
            value={`₹${stats.totalSpent.toLocaleString()}`} 
            icon={IndianRupee} 
            iconClassName="bg-emerald-500/10"
          />
        </div>

        {/* Detailed Transactions Table */}
        <Card className="border-none bg-[#1a1a1c] overflow-hidden rounded-2xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-secondary/5">
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest">Station Hub</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest">Date & Time</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest">Duration</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-right">Energy Delivered</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{item.stationName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2 w-2 text-primary/40" /> {item.stationId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(item.timestamp), 'MMM d, yyyy • HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary/60" />
                        {item.duration} mins
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
                        {item.energy.toFixed(1)} kWh
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="text-sm font-black text-emerald-500">₹{item.cost.toFixed(2)}</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2">
                       <History className="h-8 w-8 opacity-10 mb-2" />
                       <p>No charging history found.</p>
                       <p className="text-[10px] uppercase tracking-wider">Your future sessions will appear here after charging.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
