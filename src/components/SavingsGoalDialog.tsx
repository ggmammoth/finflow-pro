import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SavingsGoal } from '@/hooks/useBudgetsData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  goal?: SavingsGoal | null;
}

export default function SavingsGoalDialog({ open, onOpenChange, onSubmit, goal }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(goal?.name ?? '');
  const [icon, setIcon] = useState(goal?.icon ?? '🎯');
  const [target, setTarget] = useState(goal?.target_amount?.toString() ?? '');
  const [current, setCurrent] = useState(goal?.current_amount?.toString() ?? '0');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');

  React.useEffect(() => {
    if (open) {
      setName(goal?.name ?? '');
      setIcon(goal?.icon ?? '🎯');
      setTarget(goal?.target_amount?.toString() ?? '');
      setCurrent(goal?.current_amount?.toString() ?? '0');
      setDeadline(goal?.deadline ?? '');
    }
  }, [open, goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      icon: icon || null,
      target_amount: parseFloat(target),
      current_amount: parseFloat(current) || 0,
      deadline: deadline || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? t('budgets.editGoal') : t('budgets.addGoal')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div>
              <Label>{t('budgets.icon')}</Label>
              <Input value={icon} onChange={e => setIcon(e.target.value)} className="text-center text-lg" maxLength={4} />
            </div>
            <div>
              <Label>{t('budgets.goalName')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required placeholder={t('budgets.goalNamePlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('budgets.targetAmount')}</Label>
              <Input type="number" step="0.01" min="0" value={target} onChange={e => setTarget(e.target.value)} required />
            </div>
            <div>
              <Label>{t('budgets.currentSaved')}</Label>
              <Input type="number" step="0.01" min="0" value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t('budgets.deadline')}</Label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{goal ? t('common.update') : t('common.add')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
