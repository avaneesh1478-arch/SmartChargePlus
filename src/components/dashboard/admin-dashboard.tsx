"use client";

import { useState } from 'react';
import { StatCard } from './stat-card';
import { CreditCard, Zap, Activity, ShieldCheck, TrendingUp, Users, Plus, Trash2, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

const revenueData = [
  { name: 'Jan', value: 45000 },
  { name: 'Feb', value: 52000 },
  { name: 'Mar', value: 48000 },
  { name: 'Apr', value: 61000 },
  { name: 'May', value: 55000 },
  { name: 'Jun', value: 67000 },
];

const usageData = [
  { time: '00:00', usage: 120 },
  { time: '04:00', usage: 80 },
  { time: '08:00', usage: 350 },
  { time: '12:00', usage: 480 },
  { time: '16:00', usage: 420 },
  { time: '20:00', usage: 290 },
];

export function AdminDashboard() {
  const { stations, addStation, removeStation } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    chargingCost: '',
    latitude: '',
    longitude: ''
  });

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address || !formData.chargingCost || !formData.latitude || !formData.longitude) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill in all fields including geographic location to add a station.",
      });
      return;
    }

    addStation({
      name: formData.name,
      email: formData.email,
      address: formData.address,
      chargingCost: parseFloat(formData.chargingCost),
      lat: parseFloat(formData.latitude),
      lng: parseFloat(formData.longitude)
    });

    toast({
      title: "Station Added",
      description: `${formData.name} has been successfully registered.`,
    });

    setIsDialogOpen(false);
    setFormData({ name: '', email: '', address: '', chargingCost: '', latitude: '', longitude: '' });
  };

  const handleRemoveStation = (stationId: string, stationName: string) => {
    removeStation(stationId);
    toast({
      title: "Station Removed",
      description: `${stationName} has been removed from the network.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time network performance and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="teal-gradient-btn gap-2 h-10 px-6 font-bold">
                <Plus className="h-4 w-4" /> Add Station
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
              <form onSubmit={handleAddStation}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary">Register New Station</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Deploy a new Smart Charge+ station and assign an operator.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Station Name</Label>
                    <input
                      id="name"
                      placeholder="e.g. Central Plaza Hub"
                      className="flex h-10 w-full rounded-md border-none bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operator Email</Label>
                    <input
                      id="email"
                      type="email"
                      placeholder="e.g. operator@hub.com"
                      className="flex h-10 w-full rounded-md border-none bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
                    <input
                      id="address"
                      placeholder="e.g. 123 Tesla Way, Tech City"
                      className="flex h-10 w-full rounded-md border-none bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  
                  {/* Geographic Location Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="latitude" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latitude</Label>
                      <input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        placeholder="e.g. 40.7128"
                        className="flex h-10 w-full rounded-md border-none bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="longitude" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Longitude</Label>
                      <input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        placeholder="e.g. -74.0060"
                        className="flex h-10 w-full rounded-md border-none bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cost" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Charging Cost ($/kWh)</Label>
                    <input
                      id="cost"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 0.45"
                      className="flex h-10 w-full rounded-md border-none bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.chargingCost}
                      onChange={(e) => setFormData({ ...formData, chargingCost: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full teal-gradient-btn font-bold">Deploy Station</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Badge variant="outline" className="h-10 gap-2 px-4 success-badge hidden sm:flex">
            <ShieldCheck className="h-4 w-4" /> System Online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$328,450" icon={CreditCard} trend={{ value: 12, isUp: true }} />
        <StatCard title="Total Energy" value="1.2 GWh" icon={Zap} trend={{ value: 8.5, isUp: true }} />
        <StatCard title="Active Sessions" value="242" icon={Activity} subtext="Across the network" />
        <StatCard title="Total Users" value="12,840" icon={Users} trend={{ value: 5, isUp: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Monthly Revenue
            </CardTitle>
            <CardDescription>Network-wide revenue growth over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Network Load
            </CardTitle>
            <CardDescription>Real-time energy consumption (kW)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }}
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                />
                <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-card/50">
        <CardHeader>
          <CardTitle>Infrastructure Management</CardTitle>
          <CardDescription>Stations ranked by utilization and revenue generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead>Station Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead className="text-right">Revenue (MTD)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.station_id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell className="text-muted-foreground">{station.location}</TableCell>
                  <TableCell>
                    <Badge variant={station.status === 'active' ? 'default' : 'secondary'} className={station.status === 'active' ? 'success-badge' : ''}>
                      {station.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">99.9%</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    ${(Math.random() * 5000).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently decommission <strong>{station.name}</strong> from the network. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary/50 border-none">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive hover:bg-destructive/90 text-white"
                            onClick={() => handleRemoveStation(station.station_id, station.name)}
                          >
                            Decommission
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
