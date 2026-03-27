import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingDown, Users, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  memberCount: number;
  goalCount: number;
}

export default function FamilySummaryCards({ totalBudget, totalSpent, totalIncome, memberCount, goalCount }: Props) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const remaining = totalBudget - totalSpent;

  const cards = [
    { label: t('family.totalIncome'), value: fmt(totalIncome), icon: DollarSign, color: 'text-emerald-600' },
    { label: t('family.totalSpent'), value: fmt(totalSpent), icon: TrendingDown, color: 'text-destructive' },
    { label: t('family.remaining'), value: fmt(Math.max(0, remaining)), icon: Target, color: remaining >= 0 ? 'text-emerald-600' : 'text-destructive' },
    { label: t('family.memberCount'), value: String(memberCount), icon: Users, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
