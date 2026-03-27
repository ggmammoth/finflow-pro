import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFamilySpace } from '@/hooks/useFamilyData';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function CreateFamilyDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const createFamily = useCreateFamilySpace();

  const handleSubmit = () => {
    if (!name.trim()) return;
    createFamily.mutate(name.trim(), {
      onSuccess: () => {
        setName('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('family.createFamily')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('family.familyName')}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('family.familyNamePlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || createFamily.isPending}>
            {t('family.createFamily')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
