import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, RefreshCw,
  BarChart3, Settings, TrendingUp, Target, CalendarDays, Users,
  Baby, Shield,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { useFamilyRole } from '@/hooks/useFamilyRole';

const baseNavItems = [
  { titleKey: 'nav.dashboard', url: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'nav.income', url: '/income', icon: ArrowDownCircle },
  { titleKey: 'nav.expenses', url: '/expenses', icon: ArrowUpCircle },
  { titleKey: 'nav.recurring', url: '/recurring', icon: RefreshCw },
  { titleKey: 'nav.budgets', url: '/budgets', icon: Target },
  { titleKey: 'nav.planning', url: '/planning', icon: CalendarDays },
  { titleKey: 'nav.reports', url: '/reports', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { t } = useTranslation();
  const { hasFamily, isOwner, isAdult, isChild } = useFamilyRole();

  // Build nav items dynamically
  const navItems = [...baseNavItems];

  // Family section
  navItems.push({ titleKey: 'nav.family', url: '/family', icon: Users });
  if (hasFamily && !isChild) {
    navItems.push({ titleKey: 'nav.familyMembers', url: '/family/members', icon: Users });
  }
  if (hasFamily && isChild) {
    navItems.push({ titleKey: 'nav.childDashboard', url: '/family/child', icon: Baby });
  }
  if (hasFamily && isOwner) {
    navItems.push({ titleKey: 'nav.familySettings', url: '/family/settings', icon: Shield });
  }

  navItems.push({ titleKey: 'nav.settings', url: '/settings', icon: Settings });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="py-2">
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

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url ||
                  (item.url !== '/dashboard' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/dashboard'}
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.8125rem] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary"
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
                        {!collapsed && <span>{t(item.titleKey)}</span>}
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
