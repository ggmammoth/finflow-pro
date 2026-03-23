import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, type Category } from '@/hooks/useFinanceData';
import { useCategoryName } from '@/hooks/useCategoryName';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { category_id: string; budget_amount: number }) => void;
  existingCategoryIds: string[];
  initialData?: { category_id: string; budget_amount: number } | null;
}

export default function CategoryBudgetDialog({ open, onOpenChange, onSubmit, existingCategoryIds, initialData }: Props) {
  const { t } = useTranslation();
  const { data: categories } = useCategories('expense');
  const categoryLabel = useCategoryName();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) {
      setCategoryId(initialData?.category_id ?? '');
      setAmount(initialData?.budget_amount?.toString() ?? '');
    }
  }, [open, initialData]);

  const availableCategories = categories?.filter(
    c => !existingCategoryIds.includes(c.id) || c.id === initialData?.category_id
  ) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ category_id: categoryId, budget_amount: parseFloat(amount) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? t('budgets.editBudget') : t('budgets.addBudget')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('common.category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger><SelectValue placeholder={t('dialog.selectCategory')} /></SelectTrigger>
              <SelectContent>
                {availableCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{categoryLabel(c.name, c.icon)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('budgets.budgetAmount')}</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{initialData ? t('common.update') : t('common.add')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
