import React from 'react';
import { useTranslation } from 'react-i18next';
import { PiggyBank, Star, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useChildAllowances, useFamilySavingsGoals } from '@/hooks/useFamilyData';
import { useCurrency } from '@/hooks/useCurrency';

export default function ChildDashboard() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { memberId, hasFamily, isChild } = useFamilyRole();
  const { data: allowances = [] } = useChildAllowances(memberId ?? undefined);
  const { data: goals = [] } = useFamilySavingsGoals();

  const myGoals = goals.filter((g: any) => g.goal_type === 'child' && g.owner_member_id === memberId);

  if (!hasFamily) {
    return <div className="py-20 text-center text-muted-foreground">{t('family.noFamily')}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          {t('family.childDashboard')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('family.childWelcome')}</p>
      </div>

      {/* Allowance */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <PiggyBank className="h-5 w-5 text-primary" />
          {t('family.myAllowance')}
        </h2>
        {allowances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>{t('family.noAllowance')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {allowances.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">{fmt(Number(a.amount))}</p>
                      <p className="text-sm text-muted-foreground capitalize">{a.frequency}</p>
                    </div>
                    {a.next_due_date && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t('family.nextPayment')}</p>
                        <p className="text-sm font-medium">{a.next_due_date}</p>
                      </div>
                    )}
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground mt-2">{a.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* My Savings Goals */}
      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          {t('family.myGoals')}
        </h2>
        {myGoals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>{t('family.noChildGoals')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myGoals.map((g: any) => {
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
                    <Progress value={pct} className="h-3" />
                    {pct >= 100 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" /> {t('family.goalReached')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Encouraging message */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center">
          <p className="text-lg">⭐</p>
          <p className="text-sm font-medium mt-1">{t('family.encouragement')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
