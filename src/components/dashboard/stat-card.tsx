import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, subtext, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <Card className={cn("border-none bg-card/50 overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={cn("text-xs font-semibold", trend.isUp ? "text-emerald-500" : "text-rose-500")}>
                  {trend.isUp ? '+' : '-'}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">from last week</span>
              </div>
            )}
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={cn("p-3 rounded-xl bg-secondary/80", iconClassName)}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}