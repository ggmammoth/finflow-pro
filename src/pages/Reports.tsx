import React, { useMemo, useState } from 'react';
import { useTransactions, useCategories } from '@/hooks/useFinanceData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const Reports = () => {
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      const d = parseISO(t.date);
      const inRange = isWithinInterval(d, { start: parseISO(startDate), end: parseISO(endDate) });
      const inCat = categoryFilter === 'all' || t.category_id === categoryFilter;
      return inRange && inCat;
    });
  }, [transactions, startDate, endDate, categoryFilter]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalExpenses;

  const monthlyComparison = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    filtered.forEach(t => {
      const m = format(parseISO(t.date), 'MMM yyyy');
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
      if (t.type === 'income') months[m].income += Number(t.amount);
      else months[m].expense += Number(t.amount);
    });
    return Object.values(months).reverse();
  }, [filtered]);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Reports</h1>
        <p className="mt-1 text-muted-foreground">Analyze your financial data with filters</p>
      </div>

      {/* Filters */}
      <Card className="card-premium border-0">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
            <Input type="date" className="bg-secondary/50 border-border/60" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
            <Input type="date" className="bg-secondary/50 border-border/60" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-secondary/50 border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-premium border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">Total Income</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-income-light">
                <ArrowDownCircle className="h-4 w-4 text-income" />
              </div>
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-income">{fmt(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">Total Expenses</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-expense-light">
                <ArrowUpCircle className="h-4 w-4 text-expense" />
              </div>
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-expense">{fmt(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="card-premium border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">Net Balance</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${net >= 0 ? 'bg-income-light' : 'bg-expense-light'}`}>
                {net >= 0 ? <TrendingUp className="h-4 w-4 text-income" /> : <TrendingDown className="h-4 w-4 text-expense" />}
              </div>
            </div>
            <p className={`mt-2 font-display text-2xl font-extrabold tracking-tight ${net >= 0 ? 'text-income' : 'text-expense'}`}>{fmt(net)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="card-premium border-0">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base font-bold">Monthly Comparison</CardTitle>
          <CardDescription>Income vs expenses over selected period</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          {monthlyComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyComparison} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--income))" name="Income" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" name="Expenses" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">No data for selected period</div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="card-premium border-0">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-bold">Transactions ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction</th>
                    <th className="px-6 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="px-6 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="px-6 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-6 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3 font-medium">{t.title}</td>
                      <td className="px-6 py-3">
                        <Badge variant={t.type === 'income' ? 'default' : 'destructive'} className="text-[0.6875rem] capitalize">
                          {t.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{t.categories?.name || '—'}</td>
                      <td className="px-6 py-3 text-muted-foreground">{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                      <td className={`px-6 py-3 text-right font-bold tabular-nums ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {t.type === 'income' ? '+' : '−'}{fmt(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No transactions in this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
