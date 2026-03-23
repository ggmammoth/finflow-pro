import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X, RefreshCw, Trash2,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { enUS, de, es, fr, bg } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransactions, useRecurringPayments } from '@/hooks/useFinanceData';
import { usePaydays, useCreatePayday, useDeletePayday } from '@/hooks/usePaydays';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategoryName } from '@/hooks/useCategoryName';

const localeMap: Record<string, typeof enUS> = { en: enUS, de, es, fr, bg };

export default function Planning() {
  const { t, i18n } = useTranslation();
  const { fmt } = useCurrency();
  const categoryLabel = useCategoryName();
  const dateLocale = localeMap[i18n.language] || enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [paydayDialogOpen, setPaydayDialogOpen] = useState(false);
  const [newPaydayDay, setNewPaydayDay] = useState('1');
  const [newPaydayLabel, setNewPaydayLabel] = useState('Payday');

  // Data
  const { data: allTransactions = [] } = useTransactions();
  const { data: recurring = [] } = useRecurringPayments();
  const { data: paydays = [] } = usePaydays();
  const createPayday = useCreatePayday();
  const deletePayday = useDeletePayday();

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  // Index transactions by date
  const txByDate = useMemo(() => {
    const map: Record<string, typeof allTransactions> = {};
    allTransactions.forEach(tx => {
      (map[tx.date] ??= []).push(tx);
    });
    return map;
  }, [allTransactions]);

  // Payday days set
  const paydayDays = useMemo(() => new Set(paydays.map(p => p.day_of_month)), [paydays]);

  // Recurring due dates in view
  const recurringByDate = useMemo(() => {
    const map: Record<string, typeof recurring> = {};
    recurring.filter(r => r.is_active).forEach(r => {
      const key = r.next_due_date;
      (map[key] ??= []).push(r);
    });
    return map;
  }, [recurring]);

  // Day summary helper
  const getDaySummary = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const txs = txByDate[key] || [];
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const recurringDue = recurringByDate[key] || [];
    const isPayday = paydayDays.has(date.getDate());
    return { txs, income, expense, net: income - expense, recurringDue, isPayday, hasData: txs.length > 0 || recurringDue.length > 0 };
  };

  // Upcoming 7 days
  const upcoming = useMemo(() => {
    const items: { date: Date; label: string; amount: number; type: string; isRecurring: boolean }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const day = addDays(today, i);
      const key = format(day, 'yyyy-MM-dd');
      (txByDate[key] || []).forEach(tx => {
        items.push({ date: day, label: tx.title, amount: Number(tx.amount), type: tx.type, isRecurring: !!tx.is_recurring });
      });
      (recurringByDate[key] || []).forEach(r => {
        // Only show if no matching transaction already
        const alreadyHasTx = (txByDate[key] || []).some(tx => tx.recurring_payment_id === r.id);
        if (!alreadyHasTx) {
          items.push({ date: day, label: r.title, amount: Number(r.amount), type: r.type, isRecurring: true });
        }
      });
    }
    return items;
  }, [txByDate, recurringByDate]);

  // Selected day data
  const selectedSummary = selectedDate ? getDaySummary(selectedDate) : null;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    return format(d, 'EEE', { locale: dateLocale });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {t('planning.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('planning.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setPaydayDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t('planning.addPayday')}
        </Button>
      </div>

      {/* Payday chips */}
      {paydays.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {paydays.map(p => (
            <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
              💰 {p.label} — {t('planning.dayOfMonth', { day: p.day_of_month })}
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => deletePayday.mutate(p.id)}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base capitalize">
                {format(currentMonth, 'LLLL yyyy', { locale: dateLocale })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map(wd => (
                <div key={wd} className="text-center text-[0.65rem] font-medium text-muted-foreground uppercase py-1">{wd}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {days.map((day, idx) => {
                const inMonth = isSameMonth(day, currentMonth);
                const today_ = isToday(day);
                const s = getDaySummary(day);
                const selected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative min-h-[60px] sm:min-h-[80px] p-1 text-left transition-colors bg-card
                      hover:bg-accent/50
                      ${!inMonth ? 'opacity-30' : ''}
                      ${selected ? 'ring-2 ring-primary ring-inset' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${today_ ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {s.isPayday && <span className="text-xs">💰</span>}
                    </div>
                    {inMonth && s.hasData && (
                      <div className="mt-0.5 space-y-0.5">
                        {s.income > 0 && (
                          <div className="text-[0.55rem] sm:text-[0.6rem] font-medium text-emerald-600 dark:text-emerald-400 truncate">+{fmt(s.income)}</div>
                        )}
                        {s.expense > 0 && (
                          <div className="text-[0.55rem] sm:text-[0.6rem] font-medium text-destructive truncate">-{fmt(s.expense)}</div>
                        )}
                      </div>
                    )}
                    {inMonth && s.recurringDue.length > 0 && (
                      <RefreshCw className="absolute bottom-1 right-1 h-2.5 w-2.5 text-muted-foreground" />
                    )}
                    {inMonth && s.txs.length > 3 && (
                      <div className="absolute bottom-1 left-1 flex gap-0.5">
                        {[...Array(Math.min(s.txs.length, 4))].map((_, i) => (
                          <div key={i} className="h-1 w-1 rounded-full bg-primary/60" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Day detail */}
          {selectedDate && selectedSummary ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{format(selectedDate, 'PPP', { locale: dateLocale })}</CardTitle>
                {selectedSummary.isPayday && (
                  <Badge variant="secondary" className="w-fit">💰 {t('planning.payday')}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[0.65rem] text-muted-foreground">{t('dashboard.totalIncome')}</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(selectedSummary.income)}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] text-muted-foreground">{t('dashboard.totalExpenses')}</p>
                    <p className="text-sm font-bold text-destructive">{fmt(selectedSummary.expense)}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] text-muted-foreground">{t('dashboard.netBalance')}</p>
                    <p className={`text-sm font-bold ${selectedSummary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{fmt(selectedSummary.net)}</p>
                  </div>
                </div>

                {selectedSummary.txs.length > 0 ? (
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {selectedSummary.txs.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {tx.is_recurring && <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{tx.title}</p>
                            <p className="text-[0.6rem] text-muted-foreground">{categoryLabel(tx.categories?.name, tx.categories?.icon)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">{t('planning.noTransactionsDay')}</p>
                )}

                {selectedSummary.recurringDue.length > 0 && (
                  <div>
                    <p className="text-[0.65rem] font-medium text-muted-foreground mb-1">{t('planning.recurringDue')}</p>
                    {selectedSummary.recurringDue.map(r => (
                      <div key={r.id} className="flex items-center justify-between py-1">
                        <span className="text-xs flex items-center gap-1">🔁 {r.title}</span>
                        <span className={`text-xs font-semibold ${r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                          {fmt(Number(r.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">{t('planning.selectDay')}</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming 7 days */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('planning.upcoming7Days')}</CardTitle>
              <CardDescription className="text-xs">{t('planning.upcomingDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{t('planning.nothingUpcoming')}</p>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {upcoming.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate flex items-center gap-1">
                          {item.isRecurring && <span>🔁</span>}
                          {item.label}
                        </p>
                        <p className="text-[0.6rem] text-muted-foreground">{format(item.date, 'EEE, MMM d', { locale: dateLocale })}</p>
                      </div>
                      <span className={`text-xs font-semibold whitespace-nowrap ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                        {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Payday Dialog */}
      <Dialog open={paydayDialogOpen} onOpenChange={setPaydayDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('planning.addPayday')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            createPayday.mutate({ day_of_month: parseInt(newPaydayDay), label: newPaydayLabel });
            setPaydayDialogOpen(false);
            setNewPaydayDay('1');
            setNewPaydayLabel('Payday');
          }} className="space-y-4">
            <div>
              <Label>{t('planning.dayOfMonthLabel')}</Label>
              <Input type="number" min="1" max="31" value={newPaydayDay} onChange={e => setNewPaydayDay(e.target.value)} required />
            </div>
            <div>
              <Label>{t('planning.paydayLabel')}</Label>
              <Input value={newPaydayLabel} onChange={e => setNewPaydayLabel(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPaydayDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.add')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
