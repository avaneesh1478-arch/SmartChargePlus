"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-store';
import { Zap, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const { login, user } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'admin') {
      if (email === 'admin@gmail.com' && password === '142536') {
        login(email);
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid admin email or password.",
        });
      }
    } else {
      // Basic check for other roles in this mock environment
      login(email);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative selection:bg-primary/30">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary transition-colors">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        {/* Branding Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20">
              <Zap className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SmartCharge+</h1>
            <p className="text-xs text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full bg-[#111113] border-white/5 shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <Tabs value={role} onValueChange={handleRoleChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#1c1c1f] p-1 h-11 rounded-lg">
                <TabsTrigger 
                  value="user" 
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-medium transition-all"
                >
                  User
                </TabsTrigger>
                <TabsTrigger 
                  value="operator" 
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-medium transition-all"
                >
                  Operator
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-medium transition-all"
                >
                  Admin
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="pl-10 h-11 bg-[#1c1c1f] border-none text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="pl-10 h-11 bg-[#1c1c1f] border-none text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full teal-gradient-btn h-11 font-bold rounded-lg shadow-lg shadow-primary/20">
                Sign In
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
