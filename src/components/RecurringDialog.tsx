import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, useCreateRecurring, useUpdateRecurring, useCreateCategory, RecurringPayment } from '@/hooks/useFinanceData';
import { Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  amount: z.string().min(1, 'Amount required'),
  type: z.enum(['income', 'expense']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  next_due_date: z.string().min(1, 'Date required'),
  category_id: z.string().optional(),
  notes: z.string().max(500).optional(),
  payment_method: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRecurring?: RecurringPayment | null;
}

const RecurringDialog: React.FC<Props> = ({ open, onOpenChange, editRecurring }) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>(editRecurring?.type || 'expense');
  const { data: categories } = useCategories(selectedType);
  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const createCategoryMutation = useCreateCategory();
  const isEditing = !!editRecurring;
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editRecurring ? {
      title: editRecurring.title, amount: String(editRecurring.amount),
      type: editRecurring.type as 'income' | 'expense', frequency: editRecurring.frequency as any,
      next_due_date: editRecurring.next_due_date, category_id: editRecurring.category_id || '',
      notes: editRecurring.notes || '', payment_method: editRecurring.payment_method || '',
    } : { type: 'expense', frequency: 'monthly', next_due_date: new Date().toISOString().split('T')[0] },
  });

  React.useEffect(() => {
    if (editRecurring) {
      setSelectedType(editRecurring.type);
      reset({
        title: editRecurring.title, amount: String(editRecurring.amount),
        type: editRecurring.type as 'income' | 'expense', frequency: editRecurring.frequency as any,
        next_due_date: editRecurring.next_due_date, category_id: editRecurring.category_id || '',
        notes: editRecurring.notes || '', payment_method: editRecurring.payment_method || '',
      });
    } else {
      reset({ type: 'expense', frequency: 'monthly', next_due_date: new Date().toISOString().split('T')[0] });
      setSelectedType('expense');
    }
    setShowNewCategory(false);
    setNewCategoryName('');
  }, [editRecurring, reset, open]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const result = await createCategoryMutation.mutateAsync({ name: newCategoryName.trim(), type: selectedType });
    setValue('category_id', result.id);
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title, amount: parseFloat(data.amount), type: data.type,
      frequency: data.frequency, next_due_date: data.next_due_date,
      category_id: data.category_id || null, notes: data.notes || null,
      payment_method: data.payment_method || null, is_active: true,
    };
    if (isEditing) await updateMutation.mutateAsync({ id: editRecurring!.id, ...payload });
    else await createMutation.mutateAsync(payload);
    reset();
    onOpenChange(false);
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? t('dialog.editRecurring') : t('dialog.addRecurring')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.title')}</Label>
            <Input {...register('title')} placeholder={t('dialog.recurringPlaceholder')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input {...register('amount')} type="number" step="0.01" min="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>{t('common.type')}</Label>
              <Select onValueChange={(v) => { setValue('type', v as any); setSelectedType(v); }} defaultValue={editRecurring?.type || 'expense'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{t('dialog.income')}</SelectItem>
                  <SelectItem value="expense">{t('dialog.expense')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.frequency')}</Label>
              <Select onValueChange={(v) => setValue('frequency', v as any)} defaultValue={editRecurring?.frequency || 'monthly'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('dialog.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('dialog.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('dialog.monthly')}</SelectItem>
                  <SelectItem value="yearly">{t('dialog.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.nextDueDate')}</Label>
              <Input {...register('next_due_date')} type="date" />
            </div>
          </div>
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
              <Select onValueChange={(v) => setValue('category_id', v)} defaultValue={editRecurring?.category_id || ''}>
                <SelectTrigger><SelectValue placeholder={t('dialog.selectCategory')} /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Textarea {...register('notes')} placeholder={t('dialog.optionalNotes')} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.update') : t('common.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringDialog;