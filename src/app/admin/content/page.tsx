
"use client";

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/hooks/use-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Save, Languages, Image as ImageIcon, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Language } from '@/lib/translations';

export default function AdminContentPage() {
  const { user, allTranslations, updateTranslations } = useApp();
  const { toast } = useToast();
  const [editingTranslations, setEditingTranslations] = useState(allTranslations);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLang, setActiveLang] = useState<Language>('en');

  useEffect(() => {
    setEditingTranslations(allTranslations);
  }, [allTranslations]);

  if (user?.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Unauthorized access.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = (lang: Language) => {
    updateTranslations(lang, editingTranslations[lang]);
    toast({
      title: "Content Updated",
      description: `Home page contents for ${lang.toUpperCase()} have been saved successfully.`,
    });
  };

  const updateField = (lang: Language, section: string, key: string, value: string) => {
    setEditingTranslations(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [section]: {
          ...(prev[lang] as any)[section],
          [key]: value
        }
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateField(activeLang, 'hero', 'backgroundImage', base64String);
        toast({
          title: "Image Uploaded",
          description: `New background image has been staged for ${activeLang.toUpperCase()}. Remember to save changes.`,
        });
        // Clear input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const renderForm = (lang: Language) => {
    const content = editingTranslations[lang];
    if (!content) return null;

    return (
      <div className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-lg font-bold">Hero Section</h3>
            <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest">
              <ImageIcon className="h-3 w-3" /> Visual Assets
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hero Background Image</Label>
              <div className="flex gap-2">
                <Input 
                  value={content.hero?.backgroundImage || ''} 
                  onChange={(e) => updateField(lang, 'hero', 'backgroundImage', e.target.value)}
                  className="bg-secondary/30 border-none flex-1"
                  placeholder="Paste image URL here..."
                />
                <Button 
                  variant="outline" 
                  className="bg-secondary/30 border-none px-4 flex items-center gap-2 font-bold"
                  onClick={() => {
                    setActiveLang(lang);
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4" /> Upload
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Enter a direct URL or upload a high-quality photo from your local gallery.</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input 
                value={content.hero?.title || ''} 
                onChange={(e) => updateField(lang, 'hero', 'title', e.target.value)}
                className="bg-secondary/30 border-none"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtitle</Label>
              <Textarea 
                value={content.hero?.subtitle || ''} 
                onChange={(e) => updateField(lang, 'hero', 'subtitle', e.target.value)}
                className="bg-secondary/30 border-none min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Find Station Button</Label>
                <Input 
                  value={content.hero?.findStation || ''} 
                  onChange={(e) => updateField(lang, 'hero', 'findStation', e.target.value)}
                  className="bg-secondary/30 border-none"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Login Button</Label>
                <Input 
                  value={content.hero?.goDashboard || ''} 
                  onChange={(e) => updateField(lang, 'hero', 'goDashboard', e.target.value)}
                  className="bg-secondary/30 border-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-white/5 pb-2">How It Works</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Main Title</Label>
              <Input 
                value={content.howItWorks?.title || ''} 
                onChange={(e) => updateField(lang, 'howItWorks', 'title', e.target.value)}
                className="bg-secondary/30 border-none"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Main Subtitle</Label>
              <Input 
                value={content.howItWorks?.subtitle || ''} 
                onChange={(e) => updateField(lang, 'howItWorks', 'subtitle', e.target.value)}
                className="bg-secondary/30 border-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => handleSave(lang)} className="teal-gradient-btn gap-2 font-bold px-8">
            <Save className="h-4 w-4" /> Save {lang.toUpperCase()} Content
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hidden Global File Input */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Home Page Content</h1>
            <p className="text-muted-foreground text-sm">Customize the messaging, headlines, and visual assets for all users.</p>
          </div>
        </div>

        <Card className="border-none bg-[#1a1a1c] overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" /> Translation Settings
            </CardTitle>
            <CardDescription>Select a language tab to edit localized content and visual assets.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="en" onValueChange={(val) => setActiveLang(val as Language)} className="w-full">
              <TabsList className="bg-secondary/20 p-1 rounded-xl mb-6">
                <TabsTrigger value="en" className="flex-1 rounded-lg">English</TabsTrigger>
                <TabsTrigger value="kn" className="flex-1 rounded-lg">ಕನ್ನಡ (Kannada)</TabsTrigger>
                <TabsTrigger value="hi" className="flex-1 rounded-lg">हिन्दी (Hindi)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="en" className="mt-0">
                {renderForm('en')}
              </TabsContent>
              <TabsContent value="kn" className="mt-0">
                {renderForm('kn')}
              </TabsContent>
              <TabsContent value="hi" className="mt-0">
                {renderForm('hi')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
