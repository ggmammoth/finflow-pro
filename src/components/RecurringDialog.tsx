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
import { useCategories, useCreateRecurring, useUpdateRecurring, RecurringPayment } from '@/hooks/useFinanceData';
import { Loader2 } from 'lucide-react';

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
  const [selectedType, setSelectedType] = useState<string>(editRecurring?.type || 'expense');
  const { data: categories } = useCategories(selectedType);
  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const isEditing = !!editRecurring;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editRecurring ? {
      title: editRecurring.title,
      amount: String(editRecurring.amount),
      type: editRecurring.type as 'income' | 'expense',
      frequency: editRecurring.frequency as any,
      next_due_date: editRecurring.next_due_date,
      category_id: editRecurring.category_id || '',
      notes: editRecurring.notes || '',
      payment_method: editRecurring.payment_method || '',
    } : {
      type: 'expense',
      frequency: 'monthly',
      next_due_date: new Date().toISOString().split('T')[0],
    },
  });

  React.useEffect(() => {
    if (editRecurring) {
      setSelectedType(editRecurring.type);
      reset({
        title: editRecurring.title,
        amount: String(editRecurring.amount),
        type: editRecurring.type as 'income' | 'expense',
        frequency: editRecurring.frequency as any,
        next_due_date: editRecurring.next_due_date,
        category_id: editRecurring.category_id || '',
        notes: editRecurring.notes || '',
        payment_method: editRecurring.payment_method || '',
      });
    } else {
      reset({ type: 'expense', frequency: 'monthly', next_due_date: new Date().toISOString().split('T')[0] });
      setSelectedType('expense');
    }
  }, [editRecurring, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      amount: parseFloat(data.amount),
      type: data.type,
      frequency: data.frequency,
      next_due_date: data.next_due_date,
      category_id: data.category_id || null,
      notes: data.notes || null,
      payment_method: data.payment_method || null,
      is_active: true,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id: editRecurring!.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    reset();
    onOpenChange(false);
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Edit' : 'Add'} Recurring Payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register('title')} placeholder="e.g. Netflix subscription" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input {...register('amount')} type="number" step="0.01" min="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select onValueChange={(v) => { setValue('type', v as any); setSelectedType(v); }} defaultValue={editRecurring?.type || 'expense'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select onValueChange={(v) => setValue('frequency', v as any)} defaultValue={editRecurring?.frequency || 'monthly'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Next Due Date</Label>
              <Input {...register('next_due_date')} type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select onValueChange={(v) => setValue('category_id', v)} defaultValue={editRecurring?.category_id || ''}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Optional notes..." rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringDialog;
