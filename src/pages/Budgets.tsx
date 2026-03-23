import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Pencil, Trash2, PiggyBank, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useAddMoneyToGoal, useCategoryBudgets, useUpsertCategoryBudget, useDeleteCategoryBudget } from '@/hooks/useBudgetsData';
import { useTransactions } from '@/hooks/useFinanceData';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategoryName } from '@/hooks/useCategoryName';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import SavingsGoalDialog from '@/components/SavingsGoalDialog';
import CategoryBudgetDialog from '@/components/CategoryBudgetDialog';
import type { SavingsGoal } from '@/hooks/useBudgetsData';

export default function Budgets() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const categoryLabel = useCategoryName();

  // Savings Goals
  const { data: goals = [] } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const addMoneyToGoal = useAddMoneyToGoal();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [addMoneyGoalId, setAddMoneyGoalId] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  // Category Budgets
  const { data: budgets = [] } = useCategoryBudgets();
  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ category_id: string; budget_amount: number } | null>(null);

  // Monthly expenses
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const { data: allTransactions = [] } = useTransactions('expense');
  const monthlyExpenses = allTransactions.filter(tx => tx.date >= monthStart && tx.date <= monthEnd);

  const spentByCategory = monthlyExpenses.reduce<Record<string, number>>((acc, tx) => {
    if (tx.category_id) acc[tx.category_id] = (acc[tx.category_id] || 0) + Number(tx.amount);
    return acc;
  }, {});

  // Budget summary
  const totalBudget = budgets.reduce((s, b) => s + Number(b.budget_amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category_id] || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalOverBudget = budgets.reduce((s, b) => {
    const spent = spentByCategory[b.category_id] || 0;
    return s + Math.max(0, spent - Number(b.budget_amount));
  }, 0);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          {t('budgets.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('budgets.subtitle')}</p>
      </div>

      {/* ═══ SAVINGS GOALS ═══ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            {t('budgets.savingsGoals')}
          </h2>
          <Button size="sm" onClick={() => { setEditingGoal(null); setGoalDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> {t('budgets.addGoal')}
          </Button>
        </div>

        {goals.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <PiggyBank className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t('budgets.noGoals')}</p>
            <p className="text-xs mt-1">{t('budgets.noGoalsDesc')}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map(goal => {
              const pct = Math.min(100, goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0);
              const remaining = Math.max(0, goal.target_amount - goal.current_amount);
              const completed = goal.current_amount >= goal.target_amount;
              return (
                <Card key={goal.id} className={`relative overflow-hidden ${completed ? 'border-emerald-500/50 dark:border-emerald-400/30' : ''}`}>
                  {completed && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon || '🎯'}</span>
                        <div>
                          <CardTitle className="text-base">{goal.name}</CardTitle>
                          {goal.deadline && (
                            <CardDescription className="text-xs">{t('budgets.deadline')}: {goal.deadline}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingGoal(goal); setGoalDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('budgets.deleteGoalTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('budgets.deleteGoalDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGoal.mutate(goal.id)}>{t('common.delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{fmt(goal.current_amount)} / {fmt(goal.target_amount)}</span>
                      <span className="font-semibold">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className={`h-2.5 ${completed ? '[&>div]:bg-emerald-500' : ''}`} />
                    <p className={`text-xs font-medium ${completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {completed ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {t('budgets.goalCompleted')}</span>
                      ) : (
                        t('budgets.leftToGoal', { amount: fmt(remaining) })
                      )}
                    </p>
                    {!completed && (
                      addMoneyGoalId === goal.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number" step="0.01" min="0" className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                            placeholder={t('common.amount')} value={addMoneyAmount}
                            onChange={e => setAddMoneyAmount(e.target.value)} autoFocus
                          />
                          <Button size="sm" onClick={() => {
                            const val = parseFloat(addMoneyAmount);
                            if (val > 0) {
                              addMoneyToGoal.mutate({
                                goalId: goal.id,
                                goalName: goal.name,
                                currentAmount: goal.current_amount,
                                amount: val,
                              });
                            }
                            setAddMoneyGoalId(null); setAddMoneyAmount('');
                          }}>{t('common.add')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAddMoneyGoalId(null); setAddMoneyAmount(''); }}>{t('common.cancel')}</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setAddMoneyGoalId(goal.id)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> {t('budgets.addMoney')}
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ BUDGET PER CATEGORY ═══ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('budgets.categoryBudgets')}
          </h2>
          <Button size="sm" onClick={() => { setEditingBudget(null); setBudgetDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> {t('budgets.addBudget')}
          </Button>
        </div>

        {/* Summary row */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t('budgets.totalBudget'), value: fmt(totalBudget), color: '' },
              { label: t('budgets.totalSpent'), value: fmt(totalSpent), color: '' },
              { label: t('budgets.remainingTotal'), value: fmt(Math.max(0, totalRemaining)), color: totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive' },
              { label: t('budgets.overBudgetTotal'), value: fmt(totalOverBudget), color: totalOverBudget > 0 ? 'text-destructive' : '' },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {budgets.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t('budgets.noBudgets')}</p>
            <p className="text-xs mt-1">{t('budgets.noBudgetsDesc')}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map(b => {
              const spent = spentByCategory[b.category_id] || 0;
              const budget = Number(b.budget_amount);
              const remaining = budget - spent;
              const pct = Math.min(100, budget > 0 ? (spent / budget) * 100 : 0);
              const over = spent > budget;
              const nearLimit = pct >= 80 && !over;
              const catName = categoryLabel(b.categories?.name, b.categories?.icon);

              let barClass = '';
              if (over) barClass = '[&>div]:bg-destructive';
              else if (nearLimit) barClass = '[&>div]:bg-amber-500';

              return (
                <Card key={b.id} className={`relative overflow-hidden ${over ? 'border-destructive/50' : nearLimit ? 'border-amber-400/50' : ''}`}>
                  {over && <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />}
                  {nearLimit && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{catName}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingBudget({ category_id: b.category_id, budget_amount: budget }); setBudgetDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('budgets.deleteBudgetTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('budgets.deleteBudgetDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBudget.mutate(b.id)}>{t('common.delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{fmt(spent)} / {fmt(budget)}</span>
                      <span className="font-semibold">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className={`h-2.5 ${barClass}`} />
                    <p className={`text-xs font-medium flex items-center gap-1 ${over ? 'text-destructive' : nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                      {over ? (
                        <><AlertTriangle className="h-3.5 w-3.5" /> {t('budgets.exceededBy', { amount: fmt(Math.abs(remaining)) })}</>
                      ) : (
                        t('budgets.leftInBudget', { amount: fmt(remaining) })
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <SavingsGoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={editingGoal}
        onSubmit={data => {
          if (editingGoal) updateGoal.mutate({ id: editingGoal.id, ...data });
          else createGoal.mutate(data);
        }}
      />
      <CategoryBudgetDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        initialData={editingBudget}
        existingCategoryIds={budgets.map(b => b.category_id)}
        onSubmit={data => upsertBudget.mutate(data)}
      />
    </div>
  );
}
