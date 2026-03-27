import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateChildAllowance, useUpdateChildAllowance } from '@/hooks/useFamilyData';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  childMemberId: string | null;
  existingAllowance: any | null;
}

export default function AllowanceDialog({ open, onOpenChange, childMemberId, existingAllowance }: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [notes, setNotes] = useState('');
  const createAllowance = useCreateChildAllowance();
  const updateAllowance = useUpdateChildAllowance();

  useEffect(() => {
    if (existingAllowance) {
      setAmount(String(existingAllowance.amount));
      setFrequency(existingAllowance.frequency);
      setNotes(existingAllowance.notes || '');
    } else {
      setAmount('');
      setFrequency('monthly');
      setNotes('');
    }
  }, [existingAllowance, open]);

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (!val || !childMemberId) return;
    if (existingAllowance) {
      updateAllowance.mutate({ id: existingAllowance.id, amount: val, frequency, notes: notes || undefined }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createAllowance.mutate({ child_member_id: childMemberId, amount: val, frequency, notes: notes || undefined }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingAllowance ? t('family.editAllowance') : t('family.setAllowance')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('common.amount')}</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('dialog.frequency')}</Label>
            <Select value={frequency} onValueChange={(v: 'weekly' | 'monthly') => setFrequency(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t('dialog.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('dialog.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('dialog.optionalNotes')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!amount || createAllowance.isPending || updateAllowance.isPending}>
            {existingAllowance ? t('common.update') : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
