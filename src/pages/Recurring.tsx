import React, { useState } from 'react';
import { useRecurringPayments, useDeleteRecurring, RecurringPayment } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, RefreshCw, Calendar, ArrowUpCircle, ArrowDownCircle, Zap } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import RecurringDialog from '@/components/RecurringDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategoryName } from '@/hooks/useCategoryName';

const Recurring = () => {
  const { t } = useTranslation();
  const catLabel = useCategoryName();
  const { data: payments, isLoading } = useRecurringPayments();
  const deleteMutation = useDeleteRecurring();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { fmt } = useCurrency();
  const now = new Date();

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  const activePayments = (payments || []).filter(p => p.is_active);
  const pausedPayments = (payments || []).filter(p => !p.is_active);
  const monthlyTotal = activePayments
    .filter(p => p.type === 'expense')
    .reduce((s, p) => {
      const amount = Number(p.amount);
      if (p.frequency === 'weekly') return s + amount * 4.33;
      if (p.frequency === 'yearly') return s + amount / 12;
      if (p.frequency === 'daily') return s + amount * 30;
      return s + amount;
    }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t('recurringPage.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activePayments.length} {t('common.active')} · {t('recurringPage.estMonthly')}: <span className="font-bold text-expense">−{fmt(monthlyTotal)}</span>
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> {t('recurringPage.addRecurring')}
        </Button>
      </div>

      {activePayments.length > 0 || pausedPayments.length > 0 ? (
        <div className="space-y-6">
          {activePayments.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
              {activePayments.map(p => {
                const isOverdue = isBefore(parseISO(p.next_due_date), now);
                const isExpense = p.type === 'expense';
                return (
                  <Card key={p.id} className={`card-premium ${isOverdue ? 'ring-1 ring-expense/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isExpense ? 'bg-expense-light' : 'bg-income-light'}`}>
                            {isExpense ? <ArrowUpCircle className="h-4 w-4 text-expense" /> : <ArrowDownCircle className="h-4 w-4 text-income" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold truncate">{p.title}</h3>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <Badge variant="secondary" className="h-5 text-[0.625rem] font-normal capitalize">{t(`dialog.${p.frequency}`)}</Badge>
                              {p.categories?.name && <span className="text-[0.6875rem] text-muted-foreground truncate">· {catLabel(p.categories.name, p.categories.icon)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => { setEditing(p); setDialogOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-destructive/10" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                      <p className={`mt-3 font-display text-xl font-bold tracking-tight ${isExpense ? 'text-expense' : 'text-income'}`}>
                        {isExpense ? '−' : '+'}{fmt(Number(p.amount))}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{t('common.next')}: <span className={`font-medium ${isOverdue ? 'text-expense' : 'text-foreground'}`}>{format(parseISO(p.next_due_date), 'MMM d, yyyy')}</span></span>
                        {isOverdue && <Badge variant="destructive" className="h-4 text-[0.5625rem] px-1 py-0">{t('common.overdue')}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {pausedPayments.length > 0 && (
            <div>
              <h3 className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.paused')}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pausedPayments.map(p => (
                  <Card key={p.id} className="card-flat opacity-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium">{p.title}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground capitalize">{t(`dialog.${p.frequency}`)} · {fmt(Number(p.amount))}</p>
                        </div>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => { setEditing(p); setDialogOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="card-premium">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-recurring-light">
              <RefreshCw className="h-5 w-5 text-recurring" />
            </div>
            <p className="mt-3 text-sm font-medium">{t('recurringPage.noRecurring')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('recurringPage.noRecurringDesc')}</p>
            <Button className="mt-5" size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('recurringPage.addFirst')}
            </Button>
          </CardContent>
        </Card>
      )}

      <RecurringDialog open={dialogOpen} onOpenChange={setDialogOpen} editRecurring={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('recurringPage.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('recurringPage.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recurring;
