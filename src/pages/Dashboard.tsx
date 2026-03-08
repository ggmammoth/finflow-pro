import React, { useMemo } from 'react';
import { useTransactions, useRecurringPayments } from '@/hooks/useFinanceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, Wallet, RefreshCw, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isBefore } from 'date-fns';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#f97316'];

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
    return (transactions || []).slice(0, 8);
  }, [transactions]);

  if (loadingTx || loadingRec) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview for {format(now, 'MMMM yyyy')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <ArrowDownCircle className="h-6 w-6 text-income" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="font-display text-xl font-bold text-income">{fmt(monthlyData.income)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <ArrowUpCircle className="h-6 w-6 text-expense" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="font-display text-xl font-bold text-expense">{fmt(monthlyData.expenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className={`font-display text-xl font-bold ${monthlyData.balance >= 0 ? 'text-income' : 'text-expense'}`}>{fmt(monthlyData.balance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <RefreshCw className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="font-display text-xl font-bold">{upcomingRecurring.length}</p>
              {overdueCount > 0 && <p className="text-xs text-expense">{overdueCount} overdue</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader><CardTitle className="font-display text-lg">Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            {monthlyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader><CardTitle className="font-display text-lg">Expense Categories</CardTitle></CardHeader>
          <CardContent>
            {categoryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryChart} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">No expenses this month</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow + Recent + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-shadow lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-lg">Cash Flow</CardTitle></CardHeader>
          <CardContent>
            {cashFlowChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cashFlowChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">No transactions yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader><CardTitle className="font-display text-lg">Upcoming Payments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingRecurring.length > 0 ? upcomingRecurring.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(r.next_due_date), 'MMM d, yyyy')}</p>
                </div>
                <p className={`text-sm font-semibold ${r.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                  {r.type === 'expense' ? '-' : '+'}{fmt(Number(r.amount))}
                </p>
              </div>
            )) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No upcoming payments</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="card-shadow">
        <CardHeader><CardTitle className="font-display text-lg">Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(t => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{t.title}</td>
                      <td className="py-3 text-muted-foreground">{t.categories?.name || '—'}</td>
                      <td className="py-3 text-muted-foreground">{format(parseISO(t.date), 'MMM d')}</td>
                      <td className={`py-3 text-right font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No transactions yet. Start adding income or expenses!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
