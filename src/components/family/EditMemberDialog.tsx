import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateFamilyMember } from '@/hooks/useFamilyData';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  member: { id: string; display_name: string | null; role: string } | null;
}

export default function EditMemberDialog({ open, onOpenChange, member }: Props) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'adult' | 'child'>('adult');
  const updateMember = useUpdateFamilyMember();

  useEffect(() => {
    if (member) {
      setDisplayName(member.display_name || '');
      setRole(member.role === 'child' ? 'child' : 'adult');
    }
  }, [member]);

  const handleSubmit = () => {
    if (!member || !displayName.trim()) return;
    const updates: { id: string; display_name?: string; role?: string } = {
      id: member.id,
      display_name: displayName.trim(),
    };
    // Only allow role change for non-owner members
    if (member.role !== 'owner') {
      updates.role = role;
    }
    updateMember.mutate(updates, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const isOwnerMember = member?.role === 'owner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('family.editMember')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('family.displayName')}</Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t('family.displayNamePlaceholder')}
            />
          </div>
          {!isOwnerMember && (
            <div className="space-y-2">
              <Label>{t('family.assignRole')}</Label>
              <Select value={role} onValueChange={(v: 'adult' | 'child') => setRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">{t('family.role_adult')}</SelectItem>
                  <SelectItem value="child">{t('family.role_child')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!displayName.trim() || updateMember.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
