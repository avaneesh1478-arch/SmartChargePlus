
"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Plus, X, Save, Image as ImageIcon, CheckCircle2, Zap, Upload, Trash2, IndianRupee } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Station, Charger } from '@/types';
import Image from 'next/image';

export default function OperatorStationDetailsPage() {
  const { user, stations, chargers, updateStation, updateStationRate, addSlot, removeSlot } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myStation = useMemo(() => {
    if (!user) return undefined;
    return stations.find(s => 
      s.operator_id === user.uid || 
      (user.associated_station_id && s.station_id === user.associated_station_id)
    );
  }, [stations, user]);

  const myChargers = useMemo(() => {
    if (!myStation) return [];
    return chargers.filter(c => c.station_id === myStation.station_id);
  }, [chargers, myStation]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    base_rate: 0.45,
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
        base_rate: myStation.base_rate || 0.45,
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
    updateStation(myStation.station_id, {
        name: formData.name,
        location: formData.location,
        images: formData.images,
        services: formData.services,
        features: formData.features
    });
    updateStationRate(myStation.station_id, formData.base_rate);
    
    toast({
      title: "Station Updated",
      description: "Public details and pricing for your station have been successfully updated.",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64String]
        }));
        toast({
          title: "Image Uploaded",
          description: "Your photo has been added to the station gallery.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const isValidImageSrc = (src: string) => {
    if (!src) return false;
    return src.startsWith('http') || src.startsWith('data:image/');
  };

  const handleAddSlot = () => {
    addSlot(myStation.station_id, 1);
    toast({
      title: "Slot Added",
      description: `A new slot has been commissioned with the station-wide rate of ₹${formData.base_rate}/kWh.`,
    });
  };

  const handleRemoveSlot = (chargerId: string) => {
    removeSlot(chargerId);
    toast({
      title: "Slot Removed",
      description: "The charging slot has been decommissioned.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Info className="h-7 w-7 text-primary" /> Station Management
            </h1>
            <p className="text-muted-foreground text-sm">Configure how your station appears to EV drivers.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="teal-gradient-btn gap-2 h-11 px-8 font-bold">
              <Save className="h-4 w-4" /> Save All Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* General Info & Infrastructure */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Core Information</CardTitle>
                <CardDescription>Primary identification and station-wide settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                {/* Single Charging Price Field */}
                <div className="pt-4 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Station Charging Rate (₹/kWh)</Label>
                  <div className="relative max-w-[200px]">
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.base_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_rate: parseFloat(e.target.value) || 0 }))}
                      className="bg-black/20 border-white/5 h-12 pl-10 text-lg font-black text-primary"
                    />
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tight">This amount applies to all charging slots in this station.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-[#1a1a1c] border-white/5">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Charging Slots</CardTitle>
                  <CardDescription>Manage your technical infrastructure slots.</CardDescription>
                </div>
                <Button onClick={handleAddSlot} className="teal-gradient-btn h-10 px-6 text-sm font-bold gap-2">
                    <Plus className="h-4 w-4" /> Add Slot
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myChargers.length > 0 ? (
                    myChargers.map((charger, idx) => (
                      <div key={charger.charger_id} className="flex flex-col p-5 bg-secondary/20 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Slot {idx + 1}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{charger.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <Badge variant={charger.status === 'available' ? 'default' : 'secondary'} className={charger.status === 'available' ? 'success-badge text-[10px] uppercase' : 'text-[10px] uppercase'}>
                               {charger.status}
                             </Badge>
                             <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(charger.charger_id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Rate</span>
                          <span className="text-sm font-black text-primary">₹{charger.rate_per_kwh.toFixed(2)}/kWh</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center bg-secondary/10 border border-dashed border-white/5 rounded-2xl">
                      <p className="text-xs text-muted-foreground">No slots configured. Click "Add Slot" to begin.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none bg-[#1a1a1c] border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg">Services & Amenities</CardTitle>
                  <CardDescription>Facilities available at your location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. WiFi, Cafe" 
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
                  <CardDescription>Technical or site-specific advantages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. Solar Powered" 
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
                  
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">or</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full bg-secondary/20 border-white/5 h-11 gap-2 font-bold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Upload from Gallery
                  </Button>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    {formData.images.length > 0 ? (
                      formData.images.map((img, i) => (
                        <div key={i} className="relative group rounded-2xl overflow-hidden aspect-video border border-white/5 bg-[#1c1c1f]">
                          {isValidImageSrc(img) ? (
                            <Image 
                              src={img} 
                              alt={`Station photo ${i + 1}`} 
                              fill 
                              className="object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                (e.target as any).src = 'https://picsum.photos/seed/error/800/450';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                               <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                               <span className="text-[10px] text-muted-foreground/60">Invalid Image Source</span>
                            </div>
                          )}
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
