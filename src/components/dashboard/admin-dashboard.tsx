"use client";

import { StatCard } from './stat-card';
import { CreditCard, Zap, Activity, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-store';
import { Badge } from '@/components/ui/badge';

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
  const { stations, transactions } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time network performance and financial health.</p>
        </div>
        <Badge variant="outline" className="h-8 gap-1 pl-1 success-badge">
          <ShieldCheck className="h-4 w-4" /> System Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$328,450" icon={CreditCard} trend={{ value: 12, isUp: true }} />
        <StatCard title="Total Energy" value="1.2 GWh" icon={Zap} trend={{ value: 8.5, isUp: true }} />
        <StatCard title="Active Sessions" value="242" icon={Activity} subtext="Across 42 stations" />
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
          <CardTitle>Top Performing Stations</CardTitle>
          <CardDescription>Stations ranked by utilization and revenue generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead className="text-right">Revenue (MTD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.station_id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell className="text-muted-foreground">{station.location}</TableCell>
                  <TableCell>
                    <Badge variant={station.status === 'active' ? 'default' : 'secondary'} className={station.status === 'active' ? 'success-badge' : ''}>
                      {station.status}
                    </Badge>
                  </TableCell>
                  <TableCell>99.9%</TableCell>
                  <TableCell className="text-right font-mono">${(Math.random() * 5000).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}