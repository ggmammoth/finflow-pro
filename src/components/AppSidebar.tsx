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
        <div className={`flex items-center gap-2.5 px-5 py-5 ${collapsed ? 'justify-center px-3' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-base font-bold tracking-tight text-sidebar-accent-foreground">
              CashFlow
            </span>
          )}
        </div>

        <div className="mx-4 mb-3 border-b border-sidebar-border" />

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
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
