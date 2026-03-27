import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions, useDeleteTransaction, Transaction } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus, Pencil, Trash2, Loader2, Search,
  ArrowDownCircle, ArrowUpCircle, TrendingUp, Hash,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TransactionDialog from '@/components/TransactionDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategoryName } from '@/hooks/useCategoryName';

type FilterTab = 'all' | 'income' | 'expense';
type SortMode = 'latest' | 'oldest' | 'highest' | 'lowest';

export default function Transactions() {
  const { t } = useTranslation();
  const catLabel = useCategoryName();
  const { fmt } = useCurrency();

  // Fetch ALL transactions (no type filter)
  const { data: allTransactions, isLoading } = useTransactions();
  const deleteMutation = useDeleteTransaction();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortMode>('latest');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'income' | 'expense'>('expense');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter + search + sort
  const transactions = useMemo(() => {
    let list = allTransactions ?? [];

    // type filter
    if (filter !== 'all') list = list.filter(tx => tx.type === filter);

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tx =>
        tx.title.toLowerCase().includes(q) ||
        (tx.categories?.name ?? '').toLowerCase().includes(q)
      );
    }

    // sort
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.date.localeCompare(b.date);
        case 'highest': return Number(b.amount) - Number(a.amount);
        case 'lowest': return Number(a.amount) - Number(b.amount);
        default: return b.date.localeCompare(a.date);
      }
    });

    return list;
  }, [allTransactions, filter, search, sort]);

  // Summary stats (computed from full list, not filtered)
  const totalIncome = useMemo(
    () => (allTransactions ?? []).filter(tx => tx.type === 'income').reduce((s, tx) => s + Number(tx.amount), 0),
    [allTransactions]
  );
  const totalExpense = useMemo(
    () => (allTransactions ?? []).filter(tx => tx.type === 'expense').reduce((s, tx) => s + Number(tx.amount), 0),
    [allTransactions]
  );
  const netBalance = totalIncome - totalExpense;
  const totalCount = (allTransactions ?? []).length;

  const openAdd = (type: 'income' | 'expense') => {
    setEditing(null);
    setDialogType(type);
    setDialogOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setDialogType(tx.type as 'income' | 'expense');
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('transactions.all', 'All') },
    { key: 'income', label: t('transactions.incomeLabel', 'Income') },
    { key: 'expense', label: t('transactions.expenseLabel', 'Expenses') },
  ];

  const sortLabels: Record<SortMode, string> = {
    latest: t('transactions.sortLatest', 'Latest'),
    oldest: t('transactions.sortOldest', 'Oldest'),
    highest: t('transactions.sortHighest', 'Highest'),
    lowest: t('transactions.sortLowest', 'Lowest'),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            {t('nav.transactions', 'Transactions')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('transactions.pageSubtitle', 'All your income and expenses in one place')}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> {t('transactions.addTransaction', 'Add Transaction')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openAdd('income')} className="gap-2">
              <ArrowDownCircle className="h-4 w-4 text-income" />
              {t('dialog.addIncome')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openAdd('expense')} className="gap-2">
              <ArrowUpCircle className="h-4 w-4 text-expense" />
              {t('dialog.addExpense')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-stagger">
        <Card className="card-premium stat-card-income">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-income" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('dashboard.totalIncome')}
              </span>
            </div>
            <p className="text-xl font-bold text-income tabular-nums">{fmt(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium stat-card-expense">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-expense" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('dashboard.totalExpenses')}
              </span>
            </div>
            <p className="text-xl font-bold text-expense tabular-nums">{fmt(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium stat-card-balance">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('dashboard.netBalance')}
              </span>
            </div>
            <p className={`text-xl font-bold tabular-nums ${netBalance >= 0 ? 'text-income' : 'text-expense'}`}>
              {netBalance >= 0 ? '+' : '−'}{fmt(Math.abs(netBalance))}
            </p>
          </CardContent>
        </Card>
        <Card className="card-premium border-l-[3px] border-l-muted-foreground/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('transactions.totalTransactions', 'Transactions')}
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums text-foreground">{totalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                filter === tab.key
                  ? tab.key === 'income'
                    ? 'bg-income text-income-foreground shadow-sm'
                    : tab.key === 'expense'
                      ? 'bg-expense text-expense-foreground shadow-sm'
                      : 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative max-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('transactions.searchPlaceholder')}
              className="pl-9 bg-card border-border/60 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
                {sortLabels[sort]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(sortLabels) as SortMode[]).map(key => (
                <DropdownMenuItem key={key} onClick={() => setSort(key)}>
                  {sortLabels[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Transaction List */}
      <Card className="card-premium border-0">
        <CardContent className="p-0">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('common.type')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('common.transaction')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                      {t('common.category')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                      {t('common.date')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                      {t('common.method')}
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('common.amount')}
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr
                        key={tx.id}
                        className="group border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/30"
                      >
                        {/* Colored accent + type badge */}
                        <td className="px-5 py-3.5">
                          <Badge
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${
                              isIncome
                                ? 'bg-income-light text-income'
                                : 'bg-expense-light text-expense'
                            }`}
                          >
                            {isIncome
                              ? t('transactions.incomeTag', 'Income')
                              : t('transactions.expenseTag', 'Expense')}
                          </Badge>
                        </td>

                        {/* Title */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                isIncome ? 'bg-income-light' : 'bg-expense-light'
                              }`}
                            >
                              {isIncome
                                ? <ArrowDownCircle className="h-4 w-4 text-income" />
                                : <ArrowUpCircle className="h-4 w-4 text-expense" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium block truncate">{tx.title}</span>
                              <span className="text-xs text-muted-foreground sm:hidden">
                                {format(parseISO(tx.date), 'MMM d')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          {tx.categories?.name ? (
                            <Badge variant="secondary" className="font-normal text-xs">
                              {catLabel(tx.categories.name, tx.categories.icon)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                          {format(parseISO(tx.date), 'MMM d, yyyy')}
                        </td>

                        {/* Payment Method */}
                        <td className="px-5 py-3.5 text-muted-foreground capitalize hidden lg:table-cell">
                          {tx.payment_method?.replace('_', ' ') || '—'}
                        </td>

                        {/* Amount */}
                        <td
                          className={`px-5 py-3.5 text-right font-bold tabular-nums text-[15px] ${
                            isIncome ? 'text-income' : 'text-expense'
                          }`}
                        >
                          {isIncome ? '+' : '−'}{fmt(Number(tx.amount))}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => openEdit(tx)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                              onClick={() => setDeleteId(tx.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {search
                  ? t('transactions.noMatching')
                  : filter === 'income'
                    ? t('transactions.noIncomeYet', 'No income transactions yet')
                    : filter === 'expense'
                      ? t('transactions.noExpensesYet', 'No expense transactions yet')
                      : t('transactions.noTransactionsYet', { type: 'transactions' })}
              </p>
              {!search && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => openAdd('income')} className="gap-1.5">
                    <ArrowDownCircle className="h-3.5 w-3.5 text-income" /> {t('dialog.addIncome')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openAdd('expense')} className="gap-1.5">
                    <ArrowUpCircle className="h-3.5 w-3.5 text-expense" /> {t('dialog.addExpense')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        editTransaction={editing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('transactions.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}