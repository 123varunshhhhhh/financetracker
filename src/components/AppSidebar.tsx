import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Target,
  Settings,
  Menu,
  X
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { View } from './FinTrackerApp';
import FinTrackerLogo from "./FinTrackerLogo";

interface AppSidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const menuItems = [
  {
    id: 'dashboard' as View,
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & insights'
  },
  {
    id: 'transactions' as View,
    title: 'Transactions',
    icon: CreditCard,
    description: 'Income & expenses'
  },
  {
    id: 'budget' as View,
    title: 'Budget',
    icon: PiggyBank,
    description: 'Budget management'
  },
  {
    id: 'analytics' as View,
    title: 'Analytics',
    icon: TrendingUp,
    description: 'Financial reports'
  },
  {
    id: 'goals' as View,
    title: 'Goals',
    icon: Target,
    description: 'Savings goals'
  },
  {
    id: 'settings' as View,
    title: 'Settings',
    icon: Settings,
    description: 'App preferences'
  },
];

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar className={cn(
      "border-r border-border/50 bg-gradient-card",
      collapsed ? "w-14" : "w-72"
    )}>
      <SidebarContent className="custom-scrollbar">
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <FinTrackerLogo size={32} />
            </div>
            {/* Removed the text title for FinTracker, logo only */}
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      "w-full h-12 rounded-lg transition-all duration-300 group relative overflow-hidden",
                      currentView === item.id
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-success"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {currentView === item.id && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-primary rounded-r" />
                    )}
                    <div className="flex items-center gap-3 w-full">
                      <item.icon className={cn(
                        "w-5 h-5 transition-all duration-300",
                        currentView === item.id
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      {!collapsed && (
                        <div className="flex-1 text-left">
                          <div className={cn(
                            "font-medium text-sm",
                            currentView === item.id ? "text-primary" : ""
                          )}>
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {!collapsed && (
          <div className="p-4 mt-auto">
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">This Month</span>
                  <span className="text-sm font-medium text-success">+$2,340</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Expenses</span>
                  <span className="text-sm font-medium text-destructive">-$1,820</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <div className="bg-gradient-primary h-1.5 rounded-full w-3/4" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-2 border-t border-border/30">
          <SidebarTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 hover:bg-white/10"
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}