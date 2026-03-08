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
import { useCategories, useCreateTransaction, useUpdateTransaction, Transaction } from '@/hooks/useFinanceData';
import { Loader2 } from 'lucide-react';

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
  const { data: categories } = useCategories(type);
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isEditing = !!editTransaction;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editTransaction ? {
      title: editTransaction.title,
      amount: String(editTransaction.amount),
      date: editTransaction.date,
      category_id: editTransaction.category_id || '',
      notes: editTransaction.notes || '',
      payment_method: editTransaction.payment_method || '',
    } : {
      date: new Date().toISOString().split('T')[0],
    },
  });

  React.useEffect(() => {
    if (editTransaction) {
      reset({
        title: editTransaction.title,
        amount: String(editTransaction.amount),
        date: editTransaction.date,
        category_id: editTransaction.category_id || '',
        notes: editTransaction.notes || '',
        payment_method: editTransaction.payment_method || '',
      });
    } else {
      reset({ date: new Date().toISOString().split('T')[0] });
    }
  }, [editTransaction, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      type,
      title: data.title,
      amount: parseFloat(data.amount),
      date: data.date,
      category_id: data.category_id || null,
      notes: data.notes || null,
      payment_method: data.payment_method || null,
      is_recurring: false,
      recurring_payment_id: null,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id: editTransaction!.id, ...payload });
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
            {isEditing ? 'Edit' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register('title')} placeholder="e.g. Salary payment" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input {...register('amount')} type="number" step="0.01" min="0.01" placeholder="0.00" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input {...register('date')} type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select onValueChange={(v) => setValue('category_id', v)} defaultValue={editTransaction?.category_id || ''}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === 'expense' && (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select onValueChange={(v) => setValue('payment_method', v)} defaultValue={editTransaction?.payment_method || ''}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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

export default TransactionDialog;
