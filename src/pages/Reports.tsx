import React, { useMemo, useState } from 'react';
import { useTransactions, useCategories } from '@/hooks/useFinanceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';

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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analyze your financial data</p>
      </div>

      {/* Filters */}
      <Card className="card-shadow">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-shadow">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="font-display text-2xl font-bold text-income">{fmt(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="font-display text-2xl font-bold text-expense">{fmt(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`font-display text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-income' : 'text-expense'}`}>{fmt(totalIncome - totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="card-shadow">
        <CardHeader><CardTitle className="font-display text-lg">Monthly Comparison</CardTitle></CardHeader>
        <CardContent>
          {monthlyComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--income))" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">No data for selected period</div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="card-shadow">
        <CardHeader><CardTitle className="font-display text-lg">Transactions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{t.title}</td>
                      <td className="py-3 capitalize text-muted-foreground">{t.type}</td>
                      <td className="py-3 text-muted-foreground">{t.categories?.name || '—'}</td>
                      <td className="py-3 text-muted-foreground">{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                      <td className={`py-3 text-right font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No transactions in this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
