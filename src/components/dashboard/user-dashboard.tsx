"use client";

import { useState } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { Wallet, Navigation, Sparkles, History, MapPin, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { smartChargingStationRecommendation } from '@/ai/flows/smart-charging-station-recommendation-flow';
import { toast } from '@/hooks/use-toast';

export function UserDashboard() {
  const { user, stations, chargers, transactions } = useApp();
  const [loadingAi, setLoadingAi] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const getAiRecommendations = async () => {
    setLoadingAi(true);
    try {
      const available = stations.map(s => {
        const stationChargers = chargers.filter(c => c.station_id === s.station_id);
        const occupied = stationChargers.filter(c => c.status === 'occupied').length;
        const load = (occupied / stationChargers.length) * 100 || 0;
        return {
          station_id: s.station_id,
          name: s.name,
          location: s.location,
          charger_types: ['Level 2', 'DCFC'] as any[],
          current_load_percentage: load,
          rate_per_kwh: stationChargers[0]?.rate_per_kwh || 0.35
        };
      });

      const res = await smartChargingStationRecommendation({
        userLocation: { latitude: 40.7128, longitude: -74.0060 },
        vehicleChargerType: 'DCFC',
        preference: 'maximizeSpeed',
        availableStations: available
      });
      setRecommendations(res.recommendations);
      toast({ title: "AI Recommendations Ready", description: "Found the best stations for your current trip." });
    } catch (e) {
      toast({ title: "AI Error", description: "Could not generate recommendations.", variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, Driver</h1>
          <p className="text-muted-foreground text-sm">Your EV charging ecosystem at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" /> Session History
          </Button>
          <Button size="sm" className="gap-2 bg-primary font-bold">
            <Wallet className="h-4 w-4" /> Top Up Wallet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Wallet Balance" value={`$${user?.wallet_balance?.toFixed(2) || '0.00'}`} icon={Wallet} />
        <StatCard title="Last Session" value="45.2 kWh" subtext="Downtown Hub" icon={Zap} />
        <StatCard title="Nearby Active" value={stations.filter(s => s.status === 'active').length} icon={Navigation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-primary/5 border-primary/10 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" /> Smart Recommendation
                  </CardTitle>
                  <CardDescription>AI-powered optimal station matching</CardDescription>
                </div>
                <Button
                  onClick={getAiRecommendations}
                  disabled={loadingAi}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 font-bold"
                >
                  {loadingAi ? "Analyzing..." : "Find Best Station"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <div key={i} className="bg-background/50 p-4 rounded-xl border border-primary/20 flex gap-4 items-start">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Navigation className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{rec.station_name}</h4>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="secondary" className="h-7 text-xs px-2">Directions</Button>
                          <Button size="sm" className="h-7 text-xs px-2 font-bold">Reserve Spot</Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-white/10">
                    Tap "Find Best Station" to get personalized AI suggestions based on your battery level and preferences.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" /> Network Stations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stations.length > 0 ? (
                stations.map(station => {
                  const stationChargers = chargers.filter(c => c.station_id === station.station_id);
                  const rate = stationChargers[0]?.rate_per_kwh || 0.45;
                  
                  return (
                    <Card key={station.station_id} className="border-none bg-card/50 hover:bg-card/80 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                          <Badge className={station.status === 'active' ? 'success-badge' : 'warning-badge'}>
                            {station.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold">{station.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {station.location}
                        </p>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-sm font-bold text-emerald-500">${rate.toFixed(2)} / kWh</span>
                          <Button variant="ghost" size="sm" className="text-xs text-primary h-8 px-2 hover:bg-primary/10">Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-white/5">
                  No stations currently online in your area.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <div key={tx.transaction_id} className="p-4 flex gap-3 items-center hover:bg-secondary/20 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{tx.station_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(tx.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold">${tx.cost.toFixed(2)}</p>
                        <p className="text-[10px] text-emerald-500">{tx.energy_delivered} kWh</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No recent activity found.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-white/5">
              <Button variant="outline" className="w-full text-xs h-8 border-white/10">View Full History</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}