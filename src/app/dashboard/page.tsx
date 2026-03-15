"use client";

import { useApp } from '@/hooks/use-store';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { OperatorDashboard } from '@/components/dashboard/operator-dashboard';
import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <DashboardLayout>
      {user.role === 'ADMIN' && <AdminDashboard />}
      {user.role === 'OPERATOR' && <OperatorDashboard />}
      {user.role === 'USER' && <UserDashboard />}
    </DashboardLayout>
  );
}