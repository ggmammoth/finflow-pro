import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, PiggyBank, TrendingUp, ArrowUpCircle, Target, Shield, User, Baby, Settings, Mail, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useFamilyMembers, useFamilyTransactions, useFamilySavingsGoals, useFamilyCategoryBudgets, useCreateFamilySpace, useFamilyInvitations, useChildAllowances } from '@/hooks/useFamilyData';
import { useCurrency } from '@/hooks/useCurrency';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import CreateFamilyDialog from '@/components/family/CreateFamilyDialog';
import FamilySummaryCards from '@/components/family/FamilySummaryCards';
import InviteFamilyMemberDialog from '@/components/family/InviteFamilyMemberDialog';
import AllowanceDialog from '@/components/family/AllowanceDialog';
import EditMemberDialog from '@/components/family/EditMemberDialog';

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Shield className="h-4 w-4" />,
  adult: <User className="h-4 w-4" />,
  child: <Baby className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  owner: 'bg-primary text-primary-foreground',
  adult: 'bg-secondary text-secondary-foreground',
  child: 'bg-accent text-accent-foreground',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-muted text-muted-foreground',
  revoked: 'bg-destructive/10 text-destructive',
};

export default function Family() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const { hasFamily, activeFamily, isOwner, isAdult, isChild, isLoading, familySpaceId } = useFamilyRole();
  const { data: members = [] } = useFamilyMembers();
  const { data: transactions = [] } = useFamilyTransactions();
  const { data: goals = [] } = useFamilySavingsGoals();
  const { data: budgets = [] } = useFamilyCategoryBudgets();
  const { data: invitations = [] } = useFamilyInvitations();
  const { data: allowances = [] } = useChildAllowances();

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [allowanceOpen, setAllowanceOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<{ id: string; display_name: string | null; role: string } | null>(null);

  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const monthlyTx = transactions.filter((tx: any) => tx.date >= monthStart && tx.date <= monthEnd);
  const totalSpent = monthlyTx.filter((tx: any) => tx.type === 'expense').reduce((s: number, tx: any) => s + Number(tx.amount), 0);
  const totalIncome = monthlyTx.filter((tx: any) => tx.type === 'income').reduce((s: number, tx: any) => s + Number(tx.amount), 0);
  const totalBudget = budgets.reduce((s: number, b: any) => s + Number(b.budget_amount), 0);
  const children = members.filter((m: any) => m.role === 'child');

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>;
  }

  if (!hasFamily) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t('family.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('family.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">{t('family.noFamily')}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t('family.noFamilyDesc')}</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t('family.createFamily')}
            </Button>
          </CardContent>
        </Card>
        <CreateFamilyDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {activeFamily?.name ?? t('family.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('family.dashboardSubtitle')}</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">{t('family.tabOverview', 'Общ преглед')}</TabsTrigger>
          <TabsTrigger value="members" className="flex-1 sm:flex-none">{t('family.tabMembers', 'Членове')}</TabsTrigger>
          {isOwner && (
            <TabsTrigger value="settings" className="flex-1 sm:flex-none">{t('family.tabSettings', 'Настройки')}</TabsTrigger>
          )}
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-6 space-y-8">
          <FamilySummaryCards
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            totalIncome={totalIncome}
            memberCount={members.length}
            goalCount={goals.length}
          />

          {/* Recent Transactions */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              {t('family.recentTransactions')}
            </h2>
            {transactions.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground"><p>{t('family.noTransactions')}</p></CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {transactions.slice(0, 10).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{tx.title}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Goals */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              {t('family.familyGoals')}
            </h2>
            {goals.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground"><p>{t('family.noGoals')}</p></CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((g: any) => {
                  const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0);
                  return (
                    <Card key={g.id}>
                      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>{g.icon || '🎯'}</span> {g.name}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">{fmt(g.current_amount)} / {fmt(g.target_amount)}</span>
                          <span className="font-semibold">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Children */}
          {children.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <PiggyBank className="h-5 w-5 text-primary" />
                {t('family.children')}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {children.map((child: any) => (
                  <Card key={child.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">👦</div>
                      <div>
                        <p className="font-medium text-sm">{child.display_name || 'Child'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{child.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        {/* ── Members Tab ── */}
        <TabsContent value="members" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('family.members')}</h2>
            {isOwner && (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> {t('family.inviteMember')}
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member: any) => {
              const memberAllowance = allowances.find((a: any) => a.child_member_id === member.id);
              return (
                <Card key={member.id}>
                  <CardContent className="p-5">
                     <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {roleIcons[member.role]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.display_name || 'Member'}</p>
                          <Badge variant="secondary" className={`text-xs mt-0.5 ${roleColors[member.role]}`}>
                            {t(`family.role_${member.role}`)}
                          </Badge>
                        </div>
                      </div>
                      {isOwner && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditMember(member); setEditOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {member.role === 'child' && isOwner && (
                      <div className="mt-3 pt-3 border-t border-border">
                        {memberAllowance ? (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {t('family.allowance')}: {fmt(Number(memberAllowance.amount))}/{memberAllowance.frequency}
                            </span>
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSelectedChildId(member.id); setAllowanceOpen(true); }}>
                              {t('common.edit')}
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setSelectedChildId(member.id); setAllowanceOpen(true); }}>
                            {t('family.setAllowance')}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Settings Tab (Owner only) ── */}
        {isOwner && (
          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> {t('family.familyInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('family.familyName')}</span>
                    <span className="text-sm font-medium">{activeFamily?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('family.createdAt')}</span>
                    <span className="text-sm font-medium">{activeFamily?.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> {t('family.invitations')}</CardTitle>
                <CardDescription>{t('family.invitationsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('family.noInvitations')}</p>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium">{inv.invited_email}</p>
                          <p className="text-xs text-muted-foreground capitalize">{t('family.roleAssign')}: {inv.role_to_assign}</p>
                        </div>
                        <Badge className={`text-xs ${statusColors[inv.status] || ''}`}>{inv.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <CreateFamilyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InviteFamilyMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <AllowanceDialog
        open={allowanceOpen}
        onOpenChange={setAllowanceOpen}
        childMemberId={selectedChildId}
        existingAllowance={allowances.find((a: any) => a.child_member_id === selectedChildId) ?? null}
      />
      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={editMember}
      />
    </div>
  );
}
