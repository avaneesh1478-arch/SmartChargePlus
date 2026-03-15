"use client";

import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { Activity, Power, Settings, AlertTriangle, BatteryCharging, Zap, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

export function OperatorDashboard() {
  const { user, stations, chargers, toggleCharger } = useApp();

  const myStations = stations.filter(s => s.operator_id === user?.uid || user?.associated_station_id === s.station_id);
  const myChargers = chargers.filter(c => myStations.some(s => s.station_id === c.station_id));

  const handleToggle = (chargerId: string, status: string) => {
    toggleCharger(chargerId);
    toast({
      title: status === 'available' ? 'Charging Session Started' : 'Charging Session Stopped',
      description: `Charger ${chargerId} remotely controlled successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Station Console</h1>
          <p className="text-muted-foreground text-sm">Managing {myStations.length} assigned locations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" /> Config
          </Button>
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Activity className="h-4 w-4" /> Live Monitor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Active Chargers" value={`${myChargers.filter(c => c.status === 'occupied').length}/${myChargers.length}`} icon={Activity} />
        <StatCard title="Station Load" value="84%" icon={Zap} trend={{ value: 4, isUp: true }} />
        <StatCard title="Alerts" value="0" icon={AlertTriangle} className="text-emerald-500" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Active Stations
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {myStations.map(station => (
            <Card key={station.station_id} className="border-none bg-card/50 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between bg-secondary/20 p-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{station.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {station.location}
                  </CardDescription>
                </div>
                <Badge className="success-badge">Operational</Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {myChargers.filter(c => c.station_id === station.station_id).map(charger => (
                    <div key={charger.charger_id} className="bg-secondary/30 p-4 rounded-xl space-y-4 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BatteryCharging className={charger.status === 'occupied' ? "text-primary animate-pulse" : "text-muted-foreground"} />
                          <span className="font-bold">{charger.charger_id}</span>
                        </div>
                        <Badge variant="outline" className={charger.status === 'available' ? 'success-badge' : 'warning-badge'}>
                          {charger.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Type: {charger.type}</span>
                          <span className="font-mono">{charger.current_usage} kW</span>
                        </div>
                        <Progress value={charger.status === 'occupied' ? 75 : 0} className="h-1.5" />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={charger.status === 'available' ? 'default' : 'destructive'}
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleToggle(charger.charger_id, charger.status)}
                        >
                          <Power className="h-3 w-3" />
                          {charger.status === 'available' ? 'Start' : 'Emergency Stop'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/10 px-6 py-4 flex justify-between border-t">
                <span className="text-xs text-muted-foreground">Last heartbeat: 2 mins ago</span>
                <Button variant="link" size="sm" className="text-primary text-xs h-auto p-0">View Detailed Analytics</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}