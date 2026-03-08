import React, { useState } from 'react';
import { useRecurringPayments, useDeleteRecurring, RecurringPayment } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, RefreshCw, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import RecurringDialog from '@/components/RecurringDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Recurring = () => {
  const { data: payments, isLoading } = useRecurringPayments();
  const deleteMutation = useDeleteRecurring();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const now = new Date();

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
          <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Recurring Payments</h1>
          <p className="mt-1 text-muted-foreground">
            {activePayments.length} active · Est. monthly: <span className="font-bold text-expense">−{fmt(monthlyTotal)}</span>
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Recurring
        </Button>
      </div>

      {activePayments.length > 0 || pausedPayments.length > 0 ? (
        <div className="space-y-6">
          {activePayments.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activePayments.map(p => {
                const isOverdue = isBefore(parseISO(p.next_due_date), now);
                return (
                  <Card key={p.id} className={`card-premium border-0 transition-all ${isOverdue ? 'ring-1 ring-expense/20' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            p.type === 'expense' ? 'bg-expense-light' : 'bg-income-light'
                          }`}>
                            {p.type === 'expense'
                              ? <ArrowUpCircle className="h-5 w-5 text-expense" />
                              : <ArrowDownCircle className="h-5 w-5 text-income" />
                            }
                          </div>
                          <div>
                            <h3 className="font-semibold">{p.title}</h3>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <Badge variant="secondary" className="text-[0.6875rem] font-normal capitalize">{p.frequency}</Badge>
                              {p.categories?.name && (
                                <span className="text-[0.6875rem] text-muted-foreground">· {p.categories.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className={`mt-4 font-display text-2xl font-extrabold tracking-tight ${p.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                        {p.type === 'expense' ? '−' : '+'}{fmt(Number(p.amount))}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Next: <span className={`font-medium ${isOverdue ? 'text-expense' : 'text-foreground'}`}>
                            {format(parseISO(p.next_due_date), 'MMM d, yyyy')}
                          </span>
                        </p>
                        {isOverdue && <Badge variant="destructive" className="text-[0.625rem] px-1.5 py-0">Overdue</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {pausedPayments.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Paused</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pausedPayments.map(p => (
                  <Card key={p.id} className="card-shadow border-0 opacity-60">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{p.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground capitalize">{p.frequency} · {fmt(Number(p.amount))}</p>
                        </div>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
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
        <Card className="card-premium border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">No recurring payments yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Add subscriptions, bills, or automatic payments to track them</p>
            <Button className="mt-5" size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Add your first recurring payment
            </Button>
          </CardContent>
        </Card>
      )}

      <RecurringDialog open={dialogOpen} onOpenChange={setDialogOpen} editRecurring={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recurring payment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recurring;
