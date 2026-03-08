import React, { useState } from 'react';
import { useTransactions, useDeleteTransaction, Transaction } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TransactionDialog from '@/components/TransactionDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Props {
  type: 'income' | 'expense';
  title: string;
}

const TransactionListPage: React.FC<Props> = ({ type, title }) => {
  const { data: transactions, isLoading } = useTransactions(type);
  const deleteMutation = useDeleteTransaction();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = (transactions || []).filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.categories?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Total: <span className={`font-semibold ${type === 'income' ? 'text-income' : 'text-expense'}`}>{fmt(total)}</span></p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add {type === 'income' ? 'Income' : 'Expense'}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="card-shadow">
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Date</th>
                    {type === 'expense' && <th className="p-4 font-medium">Method</th>}
                    <th className="p-4 text-right font-medium">Amount</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium">{t.title}</td>
                      <td className="p-4 text-muted-foreground">{t.categories?.name || '—'}</td>
                      <td className="p-4 text-muted-foreground">{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                      {type === 'expense' && <td className="p-4 text-muted-foreground capitalize">{t.payment_method?.replace('_', ' ') || '—'}</td>}
                      <td className={`p-4 text-right font-semibold ${type === 'income' ? 'text-income' : 'text-expense'}`}>{fmt(Number(t.amount))}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'No matching transactions' : `No ${type} transactions yet. Click "Add" to get started!`}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} type={type} editTransaction={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionListPage;
