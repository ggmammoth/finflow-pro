import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, useCreateTransaction, useUpdateTransaction, useCreateCategory, Transaction } from '@/hooks/useFinanceData';
import { useSavingsGoals, useAddMoneyToGoal } from '@/hooks/useBudgetsData';
import { Loader2, Plus, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCategoryName } from '@/hooks/useCategoryName';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  amount: z.string().min(1, 'Amount required'),
  date: z.string().min(1, 'Date required'),
  category_id: z.string().optional(),
  notes: z.string().max(500).optional(),
  payment_method: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'income' | 'expense';
  editTransaction?: Transaction | null;
}

const TransactionDialog: React.FC<Props> = ({ open, onOpenChange, type, editTransaction }) => {
  const { t } = useTranslation();
  const catLabel = useCategoryName();
  const { data: categories } = useCategories(type);
  const { data: savingsGoals } = useSavingsGoals();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const createCategoryMutation = useCreateCategory();
  const addMoneyToGoalMutation = useAddMoneyToGoal();
  const isEditing = !!editTransaction;
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editTransaction ? {
      title: editTransaction.title,
      amount: String(editTransaction.amount),
      date: editTransaction.date,
      category_id: editTransaction.category_id || '',
      notes: editTransaction.notes || '',
      payment_method: editTransaction.payment_method || '',
    } : { date: new Date().toISOString().split('T')[0] },
  });

  // Detect if the selected category is "Savings"
  const isSavingsCategory = useMemo(() => {
    if (!selectedCategoryId || !categories) return false;
    const cat = categories.find(c => c.id === selectedCategoryId);
    return cat?.name === 'Savings';
  }, [selectedCategoryId, categories]);

  const activeGoals = savingsGoals?.filter(g => g.current_amount < g.target_amount) || [];

  React.useEffect(() => {
    if (editTransaction) {
      reset({
        title: editTransaction.title, amount: String(editTransaction.amount),
        date: editTransaction.date, category_id: editTransaction.category_id || '',
        notes: editTransaction.notes || '', payment_method: editTransaction.payment_method || '',
      });
      setSelectedCategoryId(editTransaction.category_id || '');
    } else {
      reset({ date: new Date().toISOString().split('T')[0] });
      setSelectedCategoryId('');
    }
    setShowNewCategory(false);
    setNewCategoryName('');
    setSelectedGoalId('');
  }, [editTransaction, reset, open]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setValue('category_id', value);
    // Reset goal when switching away from Savings
    const cat = categories?.find(c => c.id === value);
    if (cat?.name !== 'Savings') {
      setSelectedGoalId('');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const result = await createCategoryMutation.mutateAsync({ name: newCategoryName.trim(), type });
    handleCategoryChange(result.id);
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const onSubmit = async (data: FormData) => {
    const amount = parseFloat(data.amount);

    // If savings category + goal selected, use the addMoneyToGoal flow
    if (type === 'expense' && isSavingsCategory && selectedGoalId) {
      const goal = savingsGoals?.find(g => g.id === selectedGoalId);
      if (goal) {
        await addMoneyToGoalMutation.mutateAsync({
          goalId: goal.id,
          goalName: goal.name,
          currentAmount: goal.current_amount,
          amount,
        });
        reset();
        onOpenChange(false);
        return;
      }
    }

    const payload = {
      type, title: data.title, amount, date: data.date,
      category_id: data.category_id || null, notes: data.notes || null,
      payment_method: data.payment_method || null, is_recurring: false, recurring_payment_id: null,
    };
    if (isEditing) await updateMutation.mutateAsync({ id: editTransaction!.id, ...payload });
    else await createMutation.mutateAsync(payload);
    reset();
    onOpenChange(false);
  };

  const loading = createMutation.isPending || updateMutation.isPending || addMoneyToGoalMutation.isPending;
  const dialogTitle = isEditing
    ? (type === 'income' ? t('dialog.editIncome') : t('dialog.editExpense'))
    : (type === 'income' ? t('dialog.addIncome') : t('dialog.addExpense'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.title')}</Label>
            <Input {...register('title')} placeholder={t('dialog.titlePlaceholder')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input {...register('amount')} type="number" step="0.01" min="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>{t('common.date')}</Label>
              <Input {...register('date')} type="date" />
            </div>
          </div>

          {/* Category selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('common.category')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-primary"
                onClick={() => setShowNewCategory(!showNewCategory)}
              >
                <Plus className="h-3 w-3" />
                {t('dialog.newCategory', 'New')}
              </Button>
            </div>
            {showNewCategory ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('dialog.categoryName', 'Category name')}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                >
                  {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            ) : (
              <Select onValueChange={handleCategoryChange} value={selectedCategoryId} defaultValue={editTransaction?.category_id || ''}>
                <SelectTrigger><SelectValue placeholder={t('dialog.selectCategory')} /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{catLabel(c.name, c.icon)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Savings goal selector – appears only when Savings category is selected */}
          {type === 'expense' && isSavingsCategory && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">{t('dialog.selectGoal')}</Label>
              </div>
              {activeGoals.length > 0 ? (
                <>
                  <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('dialog.selectGoal')} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGoals.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.icon ? `${g.icon} ` : '🎯 '}{g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('dialog.savingsGoalHint')}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dialog.noGoalsAvailable')}</p>
              )}
            </div>
          )}

          {type === 'expense' && (
            <div className="space-y-2">
              <Label>{t('dialog.paymentMethod')}</Label>
              <Select onValueChange={(v) => setValue('payment_method', v)} defaultValue={editTransaction?.payment_method || ''}>
                <SelectTrigger><SelectValue placeholder={t('dialog.selectMethod')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('dialog.cash')}</SelectItem>
                  <SelectItem value="credit_card">{t('dialog.creditCard')}</SelectItem>
                  <SelectItem value="debit_card">{t('dialog.debitCard')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('dialog.bankTransfer')}</SelectItem>
                  <SelectItem value="other">{t('dialog.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Textarea {...register('notes')} placeholder={t('dialog.optionalNotes')} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading || (isSavingsCategory && !selectedGoalId && type === 'expense')}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.update') : t('common.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;