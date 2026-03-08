import React, { useState } from 'react';
import { useRecurringPayments, useDeleteRecurring, RecurringPayment } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Recurring Payments</h1>
          <p className="text-muted-foreground">Manage your subscriptions, bills, and automatic payments</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Recurring
        </Button>
      </div>

      {(payments || []).length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payments!.map(p => {
            const isOverdue = isBefore(parseISO(p.next_due_date), now);
            return (
              <Card key={p.id} className="card-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{p.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{p.frequency} · {p.categories?.name || 'Uncategorized'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className={`mt-3 font-display text-xl font-bold ${p.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                    {p.type === 'expense' ? '-' : '+'}{fmt(Number(p.amount))}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Next: {format(parseISO(p.next_due_date), 'MMM d, yyyy')}</p>
                    {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                    {!p.is_active && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="card-shadow">
          <CardContent className="py-12 text-center text-muted-foreground">
            No recurring payments yet. Add subscriptions, bills, or automatic payments to track them.
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
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recurring;
