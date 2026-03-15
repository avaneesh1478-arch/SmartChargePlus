"use client";

import { useState } from 'react';
import { useApp } from '@/hooks/use-store';
import { StatCard } from './stat-card';
import { Wallet, Navigation, Sparkles, History, MapPin, Zap, Search, SlidersHorizontal, BellOff, Star, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { smartChargingStationRecommendation } from '@/ai/flows/smart-charging-station-recommendation-flow';
import { toast } from '@/hooks/use-toast';

export function UserDashboard() {
  const { user, stations, chargers, transactions } = useApp();
  const [loadingAi, setLoadingAi] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, Driver</h1>
          <p className="text-muted-foreground text-sm">Your EV charging ecosystem at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2 bg-secondary/20 border-white/5">
            <History className="h-4 w-4" /> History
          </Button>
          <Button size="sm" className="teal-gradient-btn font-bold">
            <Wallet className="h-4 w-4" /> Top Up
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Wallet Balance" value={`$${user?.wallet_balance?.toFixed(2) || '0.00'}`} icon={Wallet} />
        <StatCard title="Last Session" value="45.2 kWh" subtext="Downtown Hub" icon={Zap} />
        <StatCard title="Nearby Active" value={stations.filter(s => s.status === 'active').length} icon={Navigation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* AI Recommendation Card */}
          <Card className="border-none bg-[#1a1a1c] border-white/5 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" /> Smart Recommendation
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/60">AI-powered optimal station matching</CardDescription>
                </div>
                <Button
                  onClick={getAiRecommendations}
                  disabled={loadingAi}
                  size="sm"
                  className="bg-primary/20 text-primary hover:bg-primary/30 font-bold border border-primary/20"
                >
                  {loadingAi ? "Analyzing..." : "Find Best Station"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <div key={i} className="bg-background/40 p-5 rounded-2xl border border-white/5 flex gap-4 items-start hover:bg-background/60 transition-colors">
                      <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/10">
                        <Navigation className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-foreground">{rec.station_name}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{rec.reason}</p>
                        <div className="flex gap-3 mt-4">
                          <Button size="sm" variant="outline" className="h-8 text-xs px-4 rounded-lg bg-white/5 border-white/10">Directions</Button>
                          <Button size="sm" className="h-8 text-xs px-4 font-bold rounded-lg teal-gradient-btn">Reserve Spot</Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Get personalized AI suggestions for your current trip.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Network Stations List (Redesigned to match image) */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Discover and Book available Chargers nearby</h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search stations..." 
                    className="pl-11 h-12 bg-[#1a1a1c] border-none rounded-xl focus-visible:ring-primary/40 placeholder:text-muted-foreground/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="secondary" className="h-12 bg-[#1a1a1c] hover:bg-[#252528] rounded-xl border-none px-6 text-muted-foreground gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  All Types
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredStations.length > 0 ? (
                filteredStations.map(station => {
                  const stationChargers = chargers.filter(c => c.station_id === station.station_id);
                  const availableCount = stationChargers.filter(c => c.status === 'available').length;
                  const totalCount = stationChargers.length;
                  const rate = stationChargers[0]?.rate_per_kwh || 0.35;
                  
                  return (
                    <Card key={station.station_id} className="border-none bg-[#111113] hover:bg-[#151517] transition-all rounded-2xl overflow-hidden group border border-white/5">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{station.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" /> {station.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="bg-secondary/40 p-1.5 rounded-full">
                                <BellOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                             </div>
                             <div className="flex items-center gap-1 bg-secondary/40 px-2 py-1 rounded-full text-[10px] font-bold">
                                <Star className="h-3 w-3 text-white fill-white" />
                                <span>5</span>
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="flex items-center gap-2 text-sm">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{availableCount}/{totalCount} available</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">${rate.toFixed(2)}/kWh</span>
                           </div>
                        </div>

                        <div className="flex gap-2 mb-6">
                          <Badge variant="secondary" className="bg-[#1c1c1f] text-[10px] py-1 px-3 rounded-lg border-none hover:bg-[#1c1c1f]">CCS</Badge>
                          <Badge variant="secondary" className="bg-[#1c1c1f] text-[10px] py-1 px-3 rounded-lg border-none hover:bg-[#1c1c1f]">Type 2</Badge>
                        </div>

                        <Button className="w-full teal-gradient-btn h-12 font-bold rounded-xl shadow-lg shadow-primary/10">
                          Book Now
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                  No stations matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar for History/Activity */}
        <div className="space-y-6">
          <Card className="border-none bg-[#1a1a1c] border-white/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <div key={tx.transaction_id} className="p-5 flex gap-4 items-center hover:bg-white/5 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{tx.station_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                          {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-foreground">${tx.cost.toFixed(2)}</p>
                        <p className="text-[10px] text-primary/80 font-bold">{tx.energy_delivered} kWh</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-muted-foreground">
                    No charging sessions yet.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-white/5 bg-secondary/5">
              <Button variant="ghost" className="w-full text-xs h-9 hover:bg-primary/5 text-primary">View Full History</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
