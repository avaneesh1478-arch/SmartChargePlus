"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Plus, X, Save, Image as ImageIcon, CheckCircle2, Zap } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Station } from '@/types';
import Image from 'next/image';

export default function OperatorStationDetailsPage() {
  const { user, stations, updateStation } = useApp();
  const { toast } = useToast();

  const myStation = useMemo(() => {
    if (!user) return undefined;
    return stations.find(s => 
      s.operator_id === user.uid || 
      (user.associated_station_id && s.station_id === user.associated_station_id)
    );
  }, [stations, user]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    images: [] as string[],
    services: [] as string[],
    features: [] as string[]
  });

  const [newImage, setNewImage] = useState('');
  const [newService, setNewService] = useState('');
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (myStation) {
      setFormData({
        name: myStation.name,
        location: myStation.location,
        images: myStation.images || [],
        services: myStation.services || [],
        features: myStation.features || []
      });
    }
  }, [myStation]);

  if (!user || user.role !== 'OPERATOR' || !myStation) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <Zap className="h-12 w-12 text-muted-foreground/20" />
           <p className="text-muted-foreground">Unauthorized access or no station assigned.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = () => {
    updateStation(myStation.station_id, formData);
    toast({
      title: "Station Updated",
      description: "Public details for your station have been successfully updated.",
    });
  };

  const addItem = (field: 'images' | 'services' | 'features', value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    setter('');
  };

  const removeItem = (field: 'images' | 'services' | 'features', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Info className="h-7 w-7 text-primary" /> Station Management
            </h1>
            <p className="text-muted-foreground text-sm">Configure how your station appears to EV drivers.</p>
          </div>
          <Button onClick={handleSave} className="teal-gradient-btn gap-2 h-11 px-8 font-bold">
            <Save className="h-4 w-4" /> Save All Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Info */}
          <div className="space-y-6">
            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Core Information</CardTitle>
                <CardDescription>Primary identification details for the network.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Station Display Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-secondary/30 border-none h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Public Address</Label>
                  <Textarea 
                    value={formData.location} 
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-secondary/30 border-none min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Services & Amenities</CardTitle>
                <CardDescription>Add facilities available at your location.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. WiFi, Cafe, Restrooms" 
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="bg-secondary/30 border-none h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addItem('services', newService, setNewService)}
                  />
                  <Button variant="outline" size="icon" onClick={() => addItem('services', newService, setNewService)} className="bg-secondary/30 border-none">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.services.map((item, i) => (
                    <Badge key={i} className="bg-primary/10 text-primary border-primary/20 gap-1 px-3 py-1">
                      {item}
                      <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => removeItem('services', i)} />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Station Features</CardTitle>
                <CardDescription>Highlight technical or site-specific advantages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Solar Powered, 24/7 Access" 
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="bg-secondary/30 border-none h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addItem('features', newFeature, setNewFeature)}
                  />
                  <Button variant="outline" size="icon" onClick={() => addItem('features', newFeature, setNewFeature)} className="bg-secondary/30 border-none">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((item, i) => (
                    <Badge key={i} className="success-badge gap-1 px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> {item}
                      <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => removeItem('features', i)} />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visuals */}
          <div className="space-y-6">
            <Card className="border-none bg-[#1a1a1c] border-white/5 h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> Gallery Management
                </CardTitle>
                <CardDescription>Upload high-quality images of your station.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter image URL..." 
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="bg-secondary/30 border-none h-11"
                      onKeyDown={(e) => e.key === 'Enter' && addItem('images', newImage, setNewImage)}
                    />
                    <Button onClick={() => addItem('images', newImage, setNewImage)} className="teal-gradient-btn h-11 px-6">
                      Add
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {formData.images.length > 0 ? (
                      formData.images.map((img, i) => (
                        <div key={i} className="relative group rounded-2xl overflow-hidden aspect-video border border-white/5">
                          <Image 
                            src={img} 
                            alt={`Station photo ${i + 1}`} 
                            fill 
                            className="object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as any).src = 'https://picsum.photos/seed/error/800/450';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeItem('images', i)}
                              className="font-bold gap-2"
                            >
                              <X className="h-4 w-4" /> Remove Image
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 border border-dashed border-white/5 rounded-2xl space-y-4">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                        <p className="text-xs text-muted-foreground">No images uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
