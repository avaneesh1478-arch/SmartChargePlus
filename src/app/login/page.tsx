"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-store';
import { Zap, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('********');
  const { login, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  const setDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary transition-colors">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-md dark-glass border-white/5 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
              <Zap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Smart Charge+</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enterprise EV Charging Intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  className="pl-10 bg-secondary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 bg-secondary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 transition-all">
              Sign In to Platform
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 border-border" onClick={() => setDemoRole('admin@gmail.com')}>
                Admin
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 border-border" onClick={() => setDemoRole('operator@gmail.com')}>
                Operator
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 border-border" onClick={() => setDemoRole('user@gmail.com')}>
                End User
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2024 Smart Charge+</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary underline-offset-4 hover:underline">Support</a>
            <a href="#" className="hover:text-primary underline-offset-4 hover:underline">Docs</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
