import React, { useMemo } from 'react';
import { useTransactions, useRecurringPayments } from '@/hooks/useFinanceData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Wallet, RefreshCw, Loader2, TrendingUp, TrendingDown, Calendar, ArrowRight, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isBefore } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const CHART_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(152 50% 50%)',
  'hsl(4 60% 58%)', 'hsl(200 65% 55%)',
];

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: transactions, isLoading: loadingTx } = useTransactions();
  const { data: recurring, isLoading: loadingRec } = useRecurringPayments();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyData = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0, balance: 0 };
    const monthTx = transactions.filter(t => isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions, monthStart, monthEnd]);

  const upcomingRecurring = useMemo(() => {
    if (!recurring) return [];
    return recurring.filter(r => r.is_active).slice(0, 5);
  }, [recurring]);

  const overdueCount = useMemo(() => {
    if (!recurring) return 0;
    return recurring.filter(r => r.is_active && isBefore(parseISO(r.next_due_date), now)).length;
  }, [recurring, now]);

  const monthlyChart = useMemo(() => {
    if (!transactions) return [];
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    transactions.forEach(t => {
      const m = format(parseISO(t.date), 'MMM yyyy');
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
      if (t.type === 'income') months[m].income += Number(t.amount);
      else months[m].expense += Number(t.amount);
    });
    return Object.values(months).reverse().slice(-6);
  }, [transactions]);

  const categoryChart = useMemo(() => {
    if (!transactions) return [];
    const cats: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
      .forEach(t => {
        const name = t.categories?.name || 'Uncategorized';
        cats[name] = (cats[name] || 0) + Number(t.amount);
      });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions, monthStart, monthEnd]);

  const cashFlowChart = useMemo(() => {
    if (!transactions) return [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    const points: { date: string; balance: number }[] = [];
    sorted.forEach(t => {
      balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
      points.push({ date: format(parseISO(t.date), 'MMM d'), balance });
    });
    return points.slice(-30);
  }, [transactions]);

  const recentTransactions = useMemo(() => (transactions || []).slice(0, 6), [transactions]);

  if (loadingTx || loadingRec) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.loadingFinances')}</p>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtFull = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.financialOverview')} <span className="font-medium text-foreground">{format(now, 'MMMM yyyy')}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-stagger">
        <Card className="card-premium stat-card-income bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.totalIncome')}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income-light">
                <ArrowDownCircle className="h-4 w-4 text-income" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tracking-tight text-income">+{fmt(monthlyData.income)}</p>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-income" />
              <span className="text-xs text-muted-foreground">{t('common.thisMonth')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium stat-card-expense bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.totalExpenses')}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense-light">
                <ArrowUpCircle className="h-4 w-4 text-expense" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tracking-tight text-expense">−{fmt(monthlyData.expenses)}</p>
            <div className="mt-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-expense" />
              <span className="text-xs text-muted-foreground">{t('common.thisMonth')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium stat-card-balance bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.netBalance')}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className={`mt-3 font-display text-2xl font-bold tracking-tight ${monthlyData.balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {monthlyData.balance >= 0 ? '+' : '−'}{fmt(Math.abs(monthlyData.balance))}
            </p>
            <div className="mt-2 flex items-center gap-1">
              {monthlyData.balance >= 0 ? <TrendingUp className="h-3 w-3 text-income" /> : <TrendingDown className="h-3 w-3 text-expense" />}
              <span className="text-xs text-muted-foreground">{t('dashboard.savingsRate')} {monthlyData.income > 0 ? Math.round((monthlyData.balance / monthlyData.income) * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium stat-card-recurring bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.recurring')}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-recurring-light">
                <RefreshCw className="h-4 w-4 text-recurring" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tracking-tight">
              {upcomingRecurring.length} <span className="text-base font-semibold text-muted-foreground">{t('common.active')}</span>
            </p>
            <div className="mt-2 flex items-center gap-1">
              {overdueCount > 0 ? (
                <Badge variant="destructive" className="h-5 text-[0.625rem] px-1.5">{overdueCount} {t('common.overdue').toLowerCase()}</Badge>
              ) : (
                <>
                  <Zap className="h-3 w-3 text-recurring" />
                  <span className="text-xs text-muted-foreground">{t('common.allOnSchedule')}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-7">
        <Card className="card-premium lg:col-span-4">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.incomeVsExpenses')}</CardTitle>
                <CardDescription className="text-xs">{t('dashboard.monthlyComparison')}</CardDescription>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-income" /> {t('dashboard.totalIncome')}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-expense" /> {t('dashboard.totalExpenses')}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3 pt-2">
            {monthlyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChart} barGap={4} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={8} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(value: number) => fmtFull(value)} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Bar dataKey="income" fill="hsl(var(--income))" radius={[5, 5, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[5, 5, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message={t('dashboard.addTxToSee')} />
            )}
          </CardContent>
        </Card>

        <Card className="card-premium lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">{t('dashboard.spendingByCategory')}</CardTitle>
            <CardDescription className="text-xs">{t('dashboard.thisMonthBreakdown')}</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 pt-2">
            {categoryChart.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                      {categoryChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmtFull(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {categoryChart.slice(0, 5).map((c, i) => {
                    const total = categoryChart.reduce((s, x) => s + x.value, 0);
                    const pct = Math.round((c.value / total) * 100);
                    return (
                      <div key={c.name} className="flex items-center gap-2.5 text-xs">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate text-muted-foreground flex-1">{c.name}</span>
                        <span className="text-muted-foreground tabular-nums">{pct}%</span>
                        <span className="font-medium tabular-nums w-16 text-right">{fmtFull(c.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyChart message={t('dashboard.noExpensesMonth')} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow + Upcoming */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="card-premium lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">{t('dashboard.cashFlowTrend')}</CardTitle>
            <CardDescription className="text-xs">{t('dashboard.runningBalance')}</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 pt-2">
            {cashFlowChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={cashFlowChart}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={8} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(value: number) => fmtFull(value)} />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#balanceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message={t('dashboard.startAddingCashFlow')} />
            )}
          </CardContent>
        </Card>

        <Card className="card-premium lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">{t('dashboard.upcomingPayments')}</CardTitle>
                <CardDescription className="text-xs">{t('dashboard.nextRecurring')}</CardDescription>
              </div>
              <Link to="/recurring">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary">
                  {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {upcomingRecurring.length > 0 ? upcomingRecurring.map(r => {
              const isOverdue = isBefore(parseISO(r.next_due_date), now);
              return (
                <div key={r.id} className={`flex items-center justify-between rounded-lg p-3 transition-colors ${isOverdue ? 'bg-expense-light border border-expense/15' : 'bg-secondary/40 hover:bg-secondary/70'}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.type === 'expense' ? 'bg-expense-light' : 'bg-income-light'}`}>
                      <RefreshCw className={`h-3.5 w-3.5 ${r.type === 'expense' ? 'text-expense' : 'text-income'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        {format(parseISO(r.next_due_date), 'MMM d')}
                        {isOverdue && <span className="ml-1 text-expense font-medium">· {t('common.overdue')}</span>}
                      </p>
                    </div>
                  </div>
                  <p className={`shrink-0 text-sm font-bold tabular-nums ${r.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                    {r.type === 'expense' ? '−' : '+'}{fmtFull(Number(r.amount))}
                  </p>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2.5 text-sm text-muted-foreground">{t('dashboard.noUpcoming')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">{t('dashboard.trackBills')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="card-premium">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">{t('dashboard.recentTransactions')}</CardTitle>
              <CardDescription className="text-xs">{t('dashboard.latestActivity')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/income">
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-income/20 text-income hover:bg-income-light hover:text-income">
                  <ArrowDownCircle className="h-3 w-3" /> {t('nav.income')}
                </Button>
              </Link>
              <Link to="/expenses">
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-expense/20 text-expense hover:bg-expense-light hover:text-expense">
                  <ArrowUpCircle className="h-3 w-3" /> {t('nav.expenses')}
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-secondary/40">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tx.type === 'income' ? 'bg-income-light' : 'bg-expense-light'}`}>
                    {tx.type === 'income' ? <ArrowDownCircle className="h-4 w-4 text-income" /> : <ArrowUpCircle className="h-4 w-4 text-expense" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.categories?.name && <span>{tx.categories.name} · </span>}
                      {format(parseISO(tx.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '−'}{fmtFull(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">{t('dashboard.noTransactions')}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">{t('dashboard.addTransactionsHint')}</p>
              <div className="mt-4 flex gap-2">
                <Link to="/income"><Button size="sm" className="h-8 text-xs">{t('dashboard.addIncome')}</Button></Link>
                <Link to="/expenses"><Button size="sm" variant="outline" className="h-8 text-xs">{t('dashboard.addExpense')}</Button></Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-[240px] flex-col items-center justify-center text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
      <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="mt-2.5 max-w-[180px] text-xs text-muted-foreground">{message}</p>
  </div>
);

const BarChart3Icon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
  </svg>
);

export default Dashboard;
