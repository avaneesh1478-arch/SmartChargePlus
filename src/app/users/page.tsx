"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  ExternalLink,
  MapPin,
  Eye
} from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UsersPage() {
  const { user: currentUser, users } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <Shield className="h-12 w-12 text-muted-foreground/20" />
           <p className="text-muted-foreground">Unauthorized access. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" /> User Directory
            </h1>
            <p className="text-muted-foreground text-sm">Monitor and manage all accounts registered across the network.</p>
          </div>
          <Badge variant="outline" className="h-10 px-4 success-badge hidden sm:flex items-center gap-2">
            <Shield className="h-4 w-4" /> {users.length} Registered Accounts
          </Badge>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name, email, or role..." 
            className="h-12 pl-12 bg-[#1a1a1c] border-white/5 rounded-xl focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card className="border-none bg-[#1a1a1c] overflow-hidden rounded-2xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-secondary/5">
                <TableHead className="py-4">User</TableHead>
                <TableHead className="py-4">Email</TableHead>
                <TableHead className="py-4">Role</TableHead>
                <TableHead className="py-4">Contact</TableHead>
                <TableHead className="py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.uid} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-1 ring-white/10">
                          <AvatarImage src={user.profileImage || `https://picsum.photos/seed/${user.uid}/40/40`} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">
                            {user.fullName || user.email.split('@')[0]}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 opacity-50" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold tracking-tight",
                        user.role === 'ADMIN' ? "border-primary text-primary bg-primary/5" :
                        user.role === 'OPERATOR' ? "border-amber-500/50 text-amber-500 bg-amber-500/5" :
                        "border-emerald-500/50 text-emerald-500 bg-emerald-500/5"
                      )}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground">
                        {user.contactNumber || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-[#1a1a1c] border-white/5">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                               <Shield className="h-5 w-5 text-primary" /> Profile Overview
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Quick view of the user's registered details.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="mt-6 flex flex-col items-center text-center space-y-4">
                             <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                               <AvatarImage src={user.profileImage || `https://picsum.photos/seed/${user.uid}/100/100`} />
                               <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                 {user.email[0].toUpperCase()}
                               </AvatarFallback>
                             </Avatar>
                             <div>
                               <h3 className="text-xl font-bold">{user.fullName || user.email.split('@')[0]}</h3>
                               <Badge className="mt-1 success-badge uppercase tracking-widest text-[10px]">
                                 {user.role}
                               </Badge>
                             </div>
                          </div>

                          <div className="mt-8 space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                             <div className="flex items-center justify-between text-xs">
                               <span className="text-muted-foreground font-medium uppercase tracking-wider">Email</span>
                               <span className="font-bold">{user.email}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                               <span className="text-muted-foreground font-medium uppercase tracking-wider">Contact</span>
                               <span className="font-bold">{user.contactNumber || 'Not Provided'}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                               <span className="text-muted-foreground font-medium uppercase tracking-wider">Address</span>
                               <span className="font-bold text-right max-w-[200px] truncate">{user.address || 'Not Provided'}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                               <span className="text-muted-foreground font-medium uppercase tracking-wider">Balance</span>
                               <span className="font-bold text-primary">₹{user.wallet_balance?.toFixed(2) || '0.00'}</span>
                             </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">
                    {searchQuery ? `No users found matching "${searchQuery}"` : "No registered users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
