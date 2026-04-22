"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MapPin
} from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AnalyticsPage() {
  const { user, stations, chargers, bookings, transactions } = useApp();

  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => {
    if (!user) return null;

    // Filter stations based on role
    const filteredStations = user.role === 'ADMIN' 
      ? stations 
      : stations.filter(s => s.operator_id === user.uid || s.station_id === user.associated_station_id);

    const filteredStationIds = filteredStations.map(s => s.station_id);

    // 1. Daily Bookings for managed stations
    const todayBookings = bookings.filter(b => b.bookingDate === todayStr && filteredStationIds.includes(b.stationId));
    const pendingToday = todayBookings.filter(b => b.status === 'pending').length;
    const confirmedToday = todayBookings.filter(b => b.status === 'confirmed').length;

    // 2. Station-wise Data
    const stationMetrics = filteredStations.map(station => {
      const stationChargers = chargers.filter(c => c.station_id === station.station_id);
      
      // Real usage percentage: (Sum of current usage / total power) * 100
      const totalCurrentUsage = stationChargers.reduce((acc, c) => acc + c.current_usage, 0);
      const usagePercentage = station.total_power > 0 
        ? Math.min(100, (totalCurrentUsage / station.total_power) * 100) 
        : 0;

      // Real Revenue: Sum of transactions + Sum of confirmed/completed bookings for this station
      const txRevenue = transactions
        .filter(t => t.station_id === station.station_id)
        .reduce((acc, t) => acc + t.cost, 0);

      const bkRevenue = bookings
        .filter(b => b.stationId === station.station_id && (b.status === 'confirmed' || b.status === 'completed'))
        .reduce((acc, b) => acc + (b.amount || 0), 0);

      return {
        name: station.name,
        usage: Math.round(usagePercentage),
        revenue: txRevenue + bkRevenue,
        id: station.station_id
      };
    });

    // 3. Overall Totals for managed scope
    const totalTxRevenue = transactions
      .filter(t => filteredStationIds.includes(t.station_id))
      .reduce((acc, t) => acc + t.cost, 0);
      
    const totalBkRevenue = bookings
      .filter(b => filteredStationIds.includes(b.stationId) && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((acc, b) => acc + (b.amount || 0), 0);

    const totalRevenue = totalTxRevenue + totalBkRevenue;
      
    const totalEnergy = transactions
      .filter(t => filteredStationIds.includes(t.station_id))
      .reduce((acc, t) => acc + t.energy_delivered, 0);

    const activeChargers = chargers
      .filter(c => filteredStationIds.includes(c.station_id) && c.status === 'occupied')
      .length;

    return {
      pendingToday,
      confirmedToday,
      stationMetrics,
      totalRevenue,
      totalEnergy,
      activeChargers,
      todayTotal: todayBookings.length,
      managedCount: filteredStations.length,
      totalCapacity: filteredStations.reduce((acc, s) => acc + s.total_power, 0)
    };
  }, [user, stations, chargers, bookings, transactions, todayStr]);

  const COLORS = ['#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

  if (!isAuthorized || !stats) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <AlertCircle className="h-12 w-12 text-muted-foreground/20" />
           <p className="text-muted-foreground">Unauthorized access. Manager privileges required.</p>
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
              <TrendingUp className="h-7 w-7 text-primary" /> {user?.role === 'ADMIN' ? 'Network Intelligence' : 'Station Insights'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {user?.role === 'ADMIN' 
                ? 'Real-time global usage patterns and financial performance.' 
                : 'Performance tracking for your assigned charging hubs.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-10 px-4 success-badge flex items-center gap-2">
              <Activity className="h-4 w-4" /> Live Tracking
            </Badge>
          </div>
        </div>

        {/* Top Level Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Revenue" 
            value={`₹${stats.totalRevenue.toLocaleString()}`} 
            icon={IndianRupee} 
            iconClassName="bg-emerald-500/10"
          />
          <StatCard 
            title="Energy Delivered" 
            value={`${stats.totalEnergy.toLocaleString()} kWh`} 
            icon={Zap} 
            iconClassName="bg-primary/10"
          />
          <StatCard 
            title="Active Sessions" 
            value={stats.activeChargers} 
            subtext="Current load" 
            icon={Activity} 
            iconClassName="bg-blue-500/10"
          />
          <StatCard 
            title="Today's Requests" 
            value={stats.todayTotal} 
            subtext={format(new Date(), 'MMM d, yyyy')}
            icon={Clock} 
            iconClassName="bg-amber-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Percentage Chart */}
          <Card className="lg:col-span-2 border-none bg-[#1a1a1c] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Hub Utilization
              </CardTitle>
              <CardDescription>Real-time percentage of power capacity currently in use.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.stationMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111113', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="usage" name="Utilization %" radius={[6, 6, 0, 0]}>
                    {stats.stationMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Today's Booking Stats */}
          <Card className="border-none bg-[#1a1a1c] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Today's Activity
              </CardTitle>
              <CardDescription>Managed station status for today.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-8">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Confirmed', value: stats.confirmedToday },
                        { name: 'Pending', value: stats.pendingToday },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#14b8a6" />
                      <Cell fill="#1e1e21" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111113', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 rounded-2xl bg-secondary/10 border border-white/5">
                  <p className="text-2xl font-bold text-emerald-500">{stats.confirmedToday}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Confirmed</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-secondary/10 border border-white/5">
                  <p className="text-2xl font-bold text-amber-500">{stats.pendingToday}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Station Revenue Table */}
          <Card className="border-none bg-[#1a1a1c] border-white/5 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" /> Revenue Generation
              </CardTitle>
              <CardDescription>Total earnings received per managed station.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-secondary/5">
                  <TableHead className="py-4">Station Hub</TableHead>
                  <TableHead className="py-4 text-right">Revenue (Total)</TableHead>
                  <TableHead className="py-4 text-right">Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.stationMetrics.map((item, idx) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="py-4 font-medium flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                       {item.name}
                    </TableCell>
                    <TableCell className="py-4 text-right font-bold">₹{item.revenue.toLocaleString()}</TableCell>
                    <TableCell className="py-4 text-right">
                      <Badge variant="secondary" className="bg-white/5 text-[10px] font-mono">
                        {stats.totalRevenue > 0 ? ((item.revenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Quick Insights Card */}
          <Card className="border-none bg-[#1a1a1c] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Performance Summary
              </CardTitle>
              <CardDescription>Automated insights based on active scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-500">Revenue Analysis</h4>
                  <p className="text-xs text-muted-foreground mt-1">Total revenue generated in this sector is ₹{stats.totalRevenue.toLocaleString()}. {stats.stationMetrics.length > 0 && `Highest performer: ${stats.stationMetrics.reduce((prev, curr) => prev.revenue > curr.revenue ? prev : curr).name}.`}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-500">Infrastructure Health</h4>
                  <p className="text-xs text-muted-foreground mt-1">{stats.activeChargers} slots are currently active. System-wide load average for these hubs is {stats.stationMetrics.length > 0 ? (stats.stationMetrics.reduce((a, b) => a + b.usage, 0) / stats.stationMetrics.length).toFixed(1) : 0}%.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">Station Density</h4>
                  <p className="text-xs text-muted-foreground mt-1">Monitoring {stats.managedCount} hubs with a total capacity of {stats.totalCapacity.toLocaleString()} kW.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
