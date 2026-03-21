import React, { useState } from 'react';
import { useTransactions, useDeleteTransaction, Transaction } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Loader2, Search, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TransactionDialog from '@/components/TransactionDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategoryName } from '@/hooks/useCategoryName';

interface Props {
  type: 'income' | 'expense';
  title: string;
}

const TransactionListPage: React.FC<Props> = ({ type, title }) => {
  const { t } = useTranslation();
  const catLabel = useCategoryName();
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

  const { fmt } = useCurrency();
  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);
  const isIncome = type === 'income';
  const translatedTitle = isIncome ? t('nav.income') : t('nav.expenses');

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">{translatedTitle}</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} {t('common.transaction').toLowerCase()}{filtered.length !== 1 ? 's' : ''} · Total:{' '}
            <span className={`font-bold ${isIncome ? 'text-income' : 'text-expense'}`}>{fmt(total)}</span>
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> {t('common.add')} {isIncome ? t('nav.income') : t('nav.expenses')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t('transactions.searchPlaceholder')} className="pl-9 bg-card border-border/60" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="card-premium border-0">
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.transaction')}</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.category')}</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.date')}</th>
                    {!isIncome && <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.method')}</th>}
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.amount')}</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="group border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isIncome ? 'bg-income-light' : 'bg-expense-light'}`}>
                            {isIncome ? <ArrowDownCircle className="h-4 w-4 text-income" /> : <ArrowUpCircle className="h-4 w-4 text-expense" />}
                          </div>
                          <span className="font-medium">{t.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {t.categories?.name ? <Badge variant="secondary" className="font-normal text-xs">{catLabel(t.categories.name, t.categories.icon)}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                      {!isIncome && <td className="px-5 py-3.5 text-muted-foreground capitalize">{t.payment_method?.replace('_', ' ') || '—'}</td>}
                      <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
                        {isIncome ? '+' : '−'}{fmt(Number(t.amount))}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isIncome ? 'bg-income-light' : 'bg-expense-light'}`}>
                {isIncome ? <ArrowDownCircle className="h-6 w-6 text-income" /> : <ArrowUpCircle className="h-6 w-6 text-expense" />}
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {search ? t('transactions.noMatching') : t('transactions.noTransactionsYet', { type })}
              </p>
              {!search && (
                <Button className="mt-4" size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-3.5 w-3.5" /> {t('transactions.addFirst', { type })}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} type={type} editTransaction={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('transactions.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionListPage;
