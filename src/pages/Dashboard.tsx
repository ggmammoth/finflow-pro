import React, { useMemo } from 'react';
import { useTransactions, useRecurringPayments } from '@/hooks/useFinanceData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Wallet, RefreshCw, Loader2, TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isBefore } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(158 50% 55%)',
  'hsl(0 60% 60%)',
  'hsl(200 70% 55%)',
];

const Dashboard = () => {
  const { data: transactions, isLoading: loadingTx } = useTransactions();
  const { data: recurring, isLoading: loadingRec } = useRecurringPayments();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyData = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0, balance: 0 };
    const monthTx = transactions.filter(t =>
      isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
    );
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
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
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

  const recentTransactions = useMemo(() => {
    return (transactions || []).slice(0, 7);
  }, [transactions]);

  if (loadingTx || loadingRec) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading your finances...</p>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtFull = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const summaryCards = [
    {
      label: 'Total Income',
      value: fmt(monthlyData.income),
      icon: ArrowDownCircle,
      trend: TrendingUp,
      accent: 'income' as const,
      bgClass: 'bg-income-light',
      iconClass: 'text-income',
      valueClass: 'text-income',
      glowClass: 'glow-income',
    },
    {
      label: 'Total Expenses',
      value: fmt(monthlyData.expenses),
      icon: ArrowUpCircle,
      trend: TrendingDown,
      accent: 'expense' as const,
      bgClass: 'bg-expense-light',
      iconClass: 'text-expense',
      valueClass: 'text-expense',
      glowClass: 'glow-expense',
    },
    {
      label: 'Net Balance',
      value: fmt(monthlyData.balance),
      icon: Wallet,
      trend: monthlyData.balance >= 0 ? TrendingUp : TrendingDown,
      accent: monthlyData.balance >= 0 ? 'income' as const : 'expense' as const,
      bgClass: monthlyData.balance >= 0 ? 'bg-income-light' : 'bg-expense-light',
      iconClass: monthlyData.balance >= 0 ? 'text-income' : 'text-expense',
      valueClass: monthlyData.balance >= 0 ? 'text-income' : 'text-expense',
      glowClass: monthlyData.balance >= 0 ? 'glow-income' : 'glow-expense',
    },
    {
      label: 'Recurring',
      value: `${upcomingRecurring.length} active`,
      icon: RefreshCw,
      trend: Calendar,
      accent: 'primary' as const,
      bgClass: 'bg-accent',
      iconClass: 'text-primary',
      valueClass: 'text-foreground',
      glowClass: '',
      extra: overdueCount > 0 ? `${overdueCount} overdue` : undefined,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Your financial overview for <span className="font-medium text-foreground">{format(now, 'MMMM yyyy')}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="card-premium border-0 bg-card" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgClass}`}>
                  <card.icon className={`h-5 w-5 ${card.iconClass}`} />
                </div>
                <card.trend className={`h-4 w-4 ${card.iconClass} opacity-60`} />
              </div>
              <div className="mt-4">
                <p className="text-[0.8125rem] font-medium text-muted-foreground">{card.label}</p>
                <p className={`mt-1 font-display text-2xl font-extrabold tracking-tight ${card.valueClass}`}>
                  {card.value}
                </p>
                {card.extra && (
                  <Badge variant="destructive" className="mt-2 text-[0.6875rem]">{card.extra}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Income vs Expenses - wider */}
        <Card className="card-premium border-0 lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-bold">Income vs Expenses</CardTitle>
                <CardDescription className="mt-0.5">Monthly comparison over time</CardDescription>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-income" /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-expense" /> Expenses
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {monthlyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChart} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(value: number) => fmtFull(value)} />
                  <Bar dataKey="income" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Add transactions to see your income vs expense comparison" />
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="card-premium border-0 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold">Spending by Category</CardTitle>
            <CardDescription className="mt-0.5">Where your money goes this month</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {categoryChart.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {categoryChart.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmtFull(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {categoryChart.slice(0, 6).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{c.name}</span>
                      <span className="ml-auto font-medium">{fmtFull(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart message="No expenses recorded this month" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="card-premium border-0 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold">Cash Flow Trend</CardTitle>
            <CardDescription className="mt-0.5">Running balance over recent transactions</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {cashFlowChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cashFlowChart}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(value: number) => fmtFull(value)} />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#balanceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Start adding transactions to see your cash flow" />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="card-premium border-0 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-bold">Upcoming Payments</CardTitle>
                <CardDescription className="mt-0.5">Next recurring charges</CardDescription>
              </div>
              <Link to="/recurring">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingRecurring.length > 0 ? upcomingRecurring.map(r => {
              const isOverdue = isBefore(parseISO(r.next_due_date), now);
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                    isOverdue ? 'border-expense/20 bg-expense-light' : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      r.type === 'expense' ? 'bg-expense-light' : 'bg-income-light'
                    }`}>
                      <RefreshCw className={`h-4 w-4 ${r.type === 'expense' ? 'text-expense' : 'text-income'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        {format(parseISO(r.next_due_date), 'MMM d, yyyy')}
                        {isOverdue && <span className="ml-1.5 text-expense font-medium">• Overdue</span>}
                      </p>
                    </div>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${r.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                    {r.type === 'expense' ? '−' : '+'}{fmtFull(Number(r.amount))}
                  </p>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">No upcoming payments</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Set up recurring payments to track bills</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="card-premium border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base font-bold">Recent Transactions</CardTitle>
              <CardDescription className="mt-0.5">Your latest financial activity</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/income">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <ArrowDownCircle className="mr-1.5 h-3 w-3 text-income" /> Income
                </Button>
              </Link>
              <Link to="/expenses">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <ArrowUpCircle className="mr-1.5 h-3 w-3 text-expense" /> Expenses
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction</th>
                    <th className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="px-6 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-6 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t, i) => (
                    <tr key={t.id} className="group border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            t.type === 'income' ? 'bg-income-light' : 'bg-expense-light'
                          }`}>
                            {t.type === 'income'
                              ? <ArrowDownCircle className="h-4 w-4 text-income" />
                              : <ArrowUpCircle className="h-4 w-4 text-expense" />
                            }
                          </div>
                          <span className="font-medium">{t.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {t.categories?.name ? (
                          <Badge variant="secondary" className="font-normal text-xs">{t.categories.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                      <td className={`px-6 py-3.5 text-right font-bold tabular-nums ${
                        t.type === 'income' ? 'text-income' : 'text-expense'
                      }`}>
                        {t.type === 'income' ? '+' : '−'}{fmtFull(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">No transactions yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Start adding income or expenses to see them here</p>
              <div className="mt-4 flex gap-2">
                <Link to="/income"><Button size="sm" className="h-8">Add Income</Button></Link>
                <Link to="/expenses"><Button size="sm" variant="outline" className="h-8">Add Expense</Button></Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-[260px] flex-col items-center justify-center text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
      <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="mt-3 max-w-[200px] text-sm text-muted-foreground">{message}</p>
  </div>
);

// Simple icon for empty states
const BarChart3Icon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
  </svg>
);

export default Dashboard;
