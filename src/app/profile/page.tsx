"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Shield, Zap, Wallet, MapPin, Calendar, Settings, LogOut, Phone, Camera, ArrowLeft, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, stations, chargers, logout, updateProfile } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    contactNumber: '',
    profileImage: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setFormData({
        fullName: user.fullName || user.email.split('@')[0],
        email: user.email,
        address: user.address || '',
        contactNumber: user.contactNumber || '',
        profileImage: user.profileImage || `https://picsum.photos/seed/${user.uid}/100/100`
      });
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    toast({
      title: "Profile Updated",
      description: "Your account information has been successfully updated.",
    });
    setIsEditDialogOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          profileImage: base64String
        }));
        toast({
          title: "Image Uploaded",
          description: "Your profile photo has been updated.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Role-specific data
  const myStation = user.role === 'OPERATOR' 
    ? stations.find(s => s.operator_id === user.uid || s.station_id === user.associated_station_id)
    : null;

  const myChargerCount = myStation 
    ? chargers.filter(c => c.station_id === myStation.station_id).length
    : 0;

  const displayName = user.fullName || user.email.split('@')[0];
  const profileImg = user.profileImage || `https://picsum.photos/seed/${user.uid}/100/100`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground hover:text-primary h-8 px-2">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your personal information and account settings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <Card className="md:col-span-1 border-none bg-[#1a1a1c] border-white/5">
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                  <AvatarImage src={profileImg} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{displayName}</h3>
                <Badge className="success-badge uppercase tracking-widest text-[10px] py-0.5 px-3">
                  {user.role}
                </Badge>
              </div>
              <div className="w-full pt-4 space-y-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-secondary/20 border-white/5 text-xs font-bold gap-2">
                      <Settings className="h-3 w-3" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                    <form onSubmit={handleSaveProfile}>
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-primary">Edit Profile</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Update your personal information below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                          <Input
                            id="fullName"
                            className="bg-secondary/50 border-none h-10"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            className="bg-secondary/50 border-none h-10"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contactNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Number</Label>
                          <Input
                            id="contactNumber"
                            className="bg-secondary/50 border-none h-10"
                            placeholder="e.g. +91 98765 43210"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
                          <Input
                            id="address"
                            className="bg-secondary/50 border-none h-10"
                            placeholder="e.g. 123 Tesla Way"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="profileImage" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile Image</Label>
                          <div className="flex gap-2">
                            <Input
                              id="profileImage"
                              className="bg-secondary/50 border-none h-10 flex-1"
                              placeholder="https://..."
                              value={formData.profileImage}
                              onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                            />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={fileInputRef} 
                              onChange={handleFileChange}
                            />
                            <Button 
                              type="button"
                              variant="outline" 
                              className="bg-secondary/20 border-white/5 h-10 px-3"
                              onClick={() => fileInputRef.current?.click()}
                              title="Upload from gallery"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full teal-gradient-btn font-bold">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
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
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contact Number</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{user.contactNumber || 'Not provided'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mailing Address</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{user.address || 'No address set'}</span>
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
                      <p className="text-xl font-bold">₹{user.wallet_balance?.toFixed(2)}</p>
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
