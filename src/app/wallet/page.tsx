
"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  IndianRupee, 
  Smartphone, 
  CreditCard, 
  Building2, 
  ArrowLeft 
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function WalletPage() {
  const { user, updateProfile } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  
  const walletBg = PlaceHolderImages.find(img => img.id === 'wallet-card-bg');
  const footerBg = PlaceHolderImages.find(img => img.id === 'wallet-footer-bg');

  const handleAddMoney = () => {
    const addVal = parseFloat(amount);
    if (isNaN(addVal) || addVal <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to recharge your wallet.",
      });
      return;
    }

    const currentBalance = user?.wallet_balance || 0;
    updateProfile({ wallet_balance: currentBalance + addVal });
    
    toast({
      title: "Recharge Successful",
      description: `₹${addVal.toFixed(2)} has been added to your wallet.`,
    });
    setAmount('');
  };

  const quickAmounts = ['200', '500', '1000', '2000'];

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-10 w-10 bg-secondary/20 border border-white/5"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="relative h-48 w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
          <Image 
            src={walletBg?.imageUrl || 'https://picsum.photos/seed/ev-wallet/800/400'} 
            alt="Wallet Background" 
            fill 
            className="object-cover opacity-80 transition-transform group-hover:scale-105"
            data-ai-hint="ev windmill"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Wallet Balance</p>
              <h2 className="text-4xl font-black text-white flex items-center gap-1">
                <span className="text-2xl">₹</span>
                {user?.wallet_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-1 w-fit">
              <p className="text-[10px] font-bold text-emerald-400">+ Free Charging Credits: ₹50.00</p>
            </div>
          </div>
        </div>

        {/* Add Money Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold">Add Money to Wallet</h3>
          
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                className="bg-[#1c1c1f] border-white/5 rounded-xl h-12 font-bold hover:bg-white/5"
                onClick={() => setAmount(q)}
              >
                ₹{q}
              </Button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
            <Input 
              placeholder="Enter Amount" 
              className="h-14 pl-10 bg-[#1c1c1f] border-none rounded-2xl text-lg font-medium focus-visible:ring-primary/40"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
            />
          </div>

          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-95"
            onClick={handleAddMoney}
          >
            Add Money
          </Button>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Payment Methods</h3>
          
          <div className="space-y-2">
            {[
              { icon: Smartphone, label: 'UPI / BHIM', iconColor: 'text-purple-400' },
              { icon: CreditCard, label: 'Credit / Debit Card', iconColor: 'text-blue-400' },
              { icon: Building2, label: 'Net Banking', iconColor: 'text-amber-400' },
            ].map((method, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-4 bg-[#1c1c1f] rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center`}>
                    <method.icon className={`h-5 w-5 ${method.iconColor}`} />
                  </div>
                  <span className="text-sm font-bold">{method.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Graphic */}
        <div className="relative h-24 w-full rounded-3xl overflow-hidden group">
          <Image 
            src={footerBg?.imageUrl || 'https://picsum.photos/seed/ev-eco/800/200'} 
            alt="Eco Promo" 
            fill 
            className="object-cover opacity-60"
            data-ai-hint="ev promo"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center px-6">
            <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Charge Up & Go Green!</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
