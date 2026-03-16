
"use client";

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/hooks/use-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Map as MapIcon, Grid, Plus, MapPin, Zap } from 'lucide-react';
import Image from 'next/image';

export default function StationsPage() {
  const { stations, user } = useApp();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Station Network</h1>
            <p className="text-muted-foreground text-sm">Real-time status of all Smart Charge+ infrastructure.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by location..." className="pl-9 h-9 w-[200px] bg-secondary/50 border-none" />
            </div>
            {user?.role === 'ADMIN' && (
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" /> Add Station
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none bg-card/50 min-h-[500px] overflow-hidden relative">
             <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center">
                <div className="text-center z-10 p-6 dark-glass rounded-2xl border-white/5 max-w-sm">
                   <MapIcon className="h-12 w-12 text-primary mx-auto mb-4" />
                   <h3 className="text-xl font-bold mb-2">Interactive Network Map</h3>
                   <p className="text-sm text-muted-foreground">This is where the Mapbox/Google Maps integration displays charging pins. Real-time status colors help users and operators find chargers.</p>
                   <Button variant="outline" className="mt-4 border-primary/50 text-primary">Load High-Res Map</Button>
                </div>
                <Image
                  src="https://picsum.photos/seed/volta-map/1200/800"
                  alt="Network Map"
                  fill
                  className="object-cover opacity-30 saturate-0"
                  data-ai-hint="dark map"
                />
             </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Listings</h2>
              <div className="flex border rounded-md p-1 bg-secondary/50">
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-background"><Grid className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MapIcon className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
              {stations.map(station => (
                <Card key={station.station_id} className="border-none bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer">
                  <CardContent className="p-4 flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center border border-border/50 shrink-0">
                      <Zap className={station.status === 'active' ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">{station.name}</h4>
                        <Badge variant="outline" className={station.status === 'active' ? 'success-badge text-[10px]' : 'warning-badge text-[10px]'}>
                          {station.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {station.location}
                      </p>
                      <div className="pt-2 flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        <span>{station.charger_count} Chargers</span>
                        <span>{station.total_power} kW Capacity</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
