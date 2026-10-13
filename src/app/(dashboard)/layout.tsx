import { DashboardProvider, TooltipProvider } from '@/components/dashboard-context';
import { Shell } from '@/components/shell';

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <DashboardProvider>
      <TooltipProvider>
        <Shell>{children}</Shell>
      </TooltipProvider>
    </DashboardProvider>
  );
}
