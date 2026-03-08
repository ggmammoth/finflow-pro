import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, RefreshCw,
  BarChart3, Settings, TrendingUp,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Income', url: '/income', icon: ArrowDownCircle },
  { title: 'Expenses', url: '/expenses', icon: ArrowUpCircle },
  { title: 'Recurring', url: '/recurring', icon: RefreshCw },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="py-2">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-5 py-5 ${collapsed ? 'justify-center px-3' : ''}`}>
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary glow-primary">
            <TrendingUp className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight text-sidebar-accent-foreground">
                CashFlow
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 mb-2 border-b border-sidebar-border" />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url ||
                  (item.url !== '/dashboard' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/dashboard'}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary shadow-sm"
                      >
                        <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom section */}
        <div className="mt-auto px-4 pb-4">
          <div className={`rounded-xl bg-sidebar-accent/50 p-4 ${collapsed ? 'hidden' : ''}`}>
            <p className="text-xs font-medium text-sidebar-accent-foreground">Pro Tip</p>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-sidebar-foreground/70">
              Set up recurring payments to automate your tracking.
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
