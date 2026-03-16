"use client";

import { useState } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { 
  DollarSign, 
  Users, 
  Zap, 
  Activity, 
  Plus, 
  Minus, 
  Circle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const earningsData = [
  { day: '02-08', amount: 240 },
  { day: '02-09', amount: 310 },
  { day: '02-10', amount: 190 },
  { day: '02-11', amount: 420 },
  { day: '02-12', amount: 370 },
  { day: '02-13', amount: 300 },
  { day: '02-14', amount: 160 },
];

export function OperatorDashboard() {
  const { user, stations, chargers, updateChargerStatus, addSlot, removeSlot } = useApp();
  const { toast } = useToast();
  const [bulkCount, setBulkCount] = useState<number>(1);

  const myStation = stations.find(s => s.operator_id === user?.uid || user?.associated_station_id === s.station_id);
  const myChargers = chargers.filter(c => c.station_id === myStation?.station_id);

  const handleStatusUpdate = (chargerId: string, newStatus: any) => {
    updateChargerStatus(chargerId, newStatus);
    toast({
      title: "Status Updated",
      description: `Slot is now ${newStatus}.`,
    });
  };

  const handleAddSlot = () => {
    if (!myStation) {
      toast({
        variant: "destructive",
        title: "Station Not Found",
        description: "You are not assigned to any station.",
      });
      return;
    }
    
    const count = Math.max(1, bulkCount);
    addSlot(myStation.station_id, count);
    toast({
      title: count > 1 ? "Slots Added" : "Slot Added",
      description: count > 1 
        ? `${count} new charging slots have been successfully added to your station.`
        : "A new charging slot has been successfully added to your station.",
    });
    setBulkCount(1);
  };

  const handleRemoveSlot = (chargerId: string) => {
    removeSlot(chargerId);
    toast({
      title: "Slot Removed",
      description: "The charging slot has been removed from your station.",
    });
  };

  const activeSlotsCount = myChargers.filter(c => c.status === 'occupied').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Operator Dashboard</h1>
        <p className="text-muted-foreground text-sm">Manage your stations and track performance</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Weekly Revenue" 
          value="$1,988" 
          icon={DollarSign} 
          trend={{ value: 12, isUp: true }} 
          iconClassName="bg-emerald-500/10"
        />
        <StatCard 
          title="Total Sessions" 
          value="138" 
          icon={Users} 
          trend={{ value: 8, isUp: true }} 
          iconClassName="bg-emerald-500/10"
        />
        <StatCard 
          title="Active Slots" 
          value={`${activeSlotsCount}/${myChargers.length}`} 
          subtext={myStation?.name || "Downtown Hub"} 
          icon={Zap} 
          iconClassName="bg-primary/10"
        />
        <StatCard 
          title="Uptime" 
          value="98.5%" 
          trend={{ value: 0.5, isUp: true }} 
          icon={Activity} 
          iconClassName="bg-primary/10"
        />
      </div>

      {/* Slot Status Grid - Updated to 2 columns (2x2 style) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Slot Status — <span className="text-muted-foreground font-medium">{myStation?.name || "Downtown EV Hub"}</span>
          </h2>
          <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-xl border border-white/5">
            <div className="flex items-center px-3 border-r border-white/10 gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Qty</span>
              <input 
                type="number" 
                min="1"
                max="50"
                value={bulkCount}
                onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                className="w-12 bg-transparent text-sm font-bold focus:outline-none text-primary"
              />
            </div>
            <Button 
              onClick={handleAddSlot}
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-1.5 px-4 h-9 rounded-lg"
            >
              <Plus className="h-4 w-4" /> Add Slots
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myChargers.map((charger, idx) => (
            <Card key={charger.charger_id} className="border-none bg-[#1a1a1c] relative overflow-hidden group">
              {charger.status === 'occupied' && (
                <div className="absolute top-3 right-3">
                  <Circle className="h-2 w-2 fill-primary text-primary" />
                </div>
              )}
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Slot {idx + 1}</h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {charger.type} - {charger.type === 'DCFC' ? '150kW' : '50kW'}
                  </p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    charger.status === 'available' ? "text-muted-foreground/60" : "text-primary"
                  )}>
                    {charger.status}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Select 
                    defaultValue={charger.status} 
                    onValueChange={(val) => handleStatusUpdate(charger.charger_id, val)}
                  >
                    <SelectTrigger className="h-9 bg-background/20 border-white/5 text-[10px] font-bold uppercase tracking-wider rounded-lg focus:ring-primary/20">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1c] border-white/10">
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 border border-red-500/10"
                    onClick={() => handleRemoveSlot(charger.charger_id)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Earnings Chart */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Weekly Earnings</h3>
        <Card className="border-none bg-[#1a1a1c] p-6 rounded-2xl">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10 }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid #ffffff10', borderRadius: '8px' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Your Recent Bookings</h3>
        <Card className="border-none bg-[#1a1a1c] overflow-hidden rounded-2xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-secondary/5">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Slot</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Time</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { customer: 'John Doe', slot: 'Slot 4', time: '14:30', status: 'Completed', amount: '$24.50' },
                { customer: 'Sarah Miller', slot: 'Slot 1', time: '15:15', status: 'Active', amount: '$12.00' },
                { customer: 'Alex Chen', slot: 'Slot 9', time: '16:00', status: 'Pending', amount: '$45.00' },
              ].map((booking, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="text-sm font-medium py-4">{booking.customer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground py-4">{booking.slot}</TableCell>
                  <TableCell className="text-sm text-muted-foreground py-4">{booking.time}</TableCell>
                  <TableCell className="py-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                      booking.status === 'Completed' ? "success-badge" : 
                      booking.status === 'Active' ? "bg-primary/10 text-primary border-primary/20" : 
                      "warning-badge"
                    )}>
                      {booking.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-mono font-bold text-right py-4">{booking.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
