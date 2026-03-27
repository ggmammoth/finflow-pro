import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, PiggyBank, TrendingUp, ArrowUpCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useFamilyMembers, useFamilyTransactions, useFamilySavingsGoals, useFamilyCategoryBudgets, useCreateFamilySpace } from '@/hooks/useFamilyData';
import { useCurrency } from '@/hooks/useCurrency';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import CreateFamilyDialog from '@/components/family/CreateFamilyDialog';
import FamilySummaryCards from '@/components/family/FamilySummaryCards';

export default function Family() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { hasFamily, activeFamily, isOwner, isAdult, isChild, isLoading } = useFamilyRole();
  const { data: members = [] } = useFamilyMembers();
  const { data: transactions = [] } = useFamilyTransactions();
  const { data: goals = [] } = useFamilySavingsGoals();
  const { data: budgets = [] } = useFamilyCategoryBudgets();
  const [createOpen, setCreateOpen] = useState(false);

  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const monthlyTx = transactions.filter((tx: any) => tx.date >= monthStart && tx.date <= monthEnd);
  const totalSpent = monthlyTx.filter((tx: any) => tx.type === 'expense').reduce((s: number, tx: any) => s + Number(tx.amount), 0);
  const totalIncome = monthlyTx.filter((tx: any) => tx.type === 'income').reduce((s: number, tx: any) => s + Number(tx.amount), 0);
  const totalBudget = budgets.reduce((s: number, b: any) => s + Number(b.budget_amount), 0);
  const children = members.filter((m: any) => m.role === 'child');

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {activeFamily?.name ?? t('family.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('family.dashboardSubtitle')}</p>
      </div>

      {/* Summary Cards */}
      <FamilySummaryCards
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        totalIncome={totalIncome}
        memberCount={members.length}
        goalCount={goals.length}
      />

      {/* Recent Family Transactions */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ArrowUpCircle className="h-5 w-5 text-primary" />
          {t('family.recentTransactions')}
        </h2>
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>{t('family.noTransactions')}</p>
            </CardContent>
          </Card>
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
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Family Goals */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          {t('family.familyGoals')}
        </h2>
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>{t('family.noGoals')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((g: any) => {
              const pct = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0);
              return (
                <Card key={g.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{g.icon || '🎯'}</span> {g.name}
                    </CardTitle>
                  </CardHeader>
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

      {/* Children Summary */}
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
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                    👦
                  </div>
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
    </div>
  );
}
