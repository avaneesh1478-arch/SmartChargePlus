"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Zap, Wallet, MapPin, Calendar, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, stations, chargers, logout } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Role-specific data
  const myStation = user.role === 'OPERATOR' 
    ? stations.find(s => s.operator_id === user.uid || s.station_id === user.associated_station_id)
    : null;

  const myChargerCount = myStation 
    ? chargers.filter(c => c.station_id === myStation.station_id).length
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your personal information and account settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <Card className="md:col-span-1 border-none bg-[#1a1a1c] border-white/5">
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{user.email.split('@')[0]}</h3>
                <Badge className="success-badge uppercase tracking-widest text-[10px] py-0.5 px-3">
                  {user.role}
                </Badge>
              </div>
              <div className="w-full pt-4 space-y-2">
                <Button variant="outline" className="w-full bg-secondary/20 border-white/5 text-xs font-bold gap-2">
                  <Settings className="h-3 w-3" /> Edit Profile
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 text-xs font-bold gap-2">
                  <LogOut className="h-3 w-3" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Personal Details</CardTitle>
                <CardDescription>Verified information linked to your identity.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Member Since</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Security Status</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-emerald-500 font-medium">Verified Account</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User ID</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs">{user.uid}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-Specific Stats Card */}
            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Network Statistics</CardTitle>
                <CardDescription>Key performance metrics for your {user.role.toLowerCase()} account.</CardDescription>
              </CardHeader>
              <CardContent>
                {user.role === 'USER' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/40 p-4 rounded-2xl border border-white/5 text-center">
                      <Wallet className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-xl font-bold">${user.wallet_balance?.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
                    </div>
                    <div className="bg-background/40 p-4 rounded-2xl border border-white/5 text-center">
                      <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-xl font-bold">12</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Sessions</p>
                    </div>
                  </div>
                )}

                {user.role === 'OPERATOR' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/40 p-4 rounded-2xl border border-white/5 text-center">
                      <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-bold truncate">{myStation?.name || 'No Station Assigned'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Managed Hub</p>
                    </div>
                    <div className="bg-background/40 p-4 rounded-2xl border border-white/5 text-center">
                      <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-xl font-bold">{myChargerCount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Slots</p>
                    </div>
                  </div>
                )}

                {user.role === 'ADMIN' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/40 p-4 rounded-2xl border border-white/5 text-center">
                      <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-xl font-bold">{stations.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Stations</p>
                    </div>
                    <div className="bg-background/40 p-4 rounded-2xl border border-white/5 text-center">
                      <Shield className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-xl font-bold">100%</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">System Health</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
