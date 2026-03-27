import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInviteFamilyMember } from '@/hooks/useFamilyData';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function InviteFamilyMemberDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'adult' | 'child'>('adult');
  const invite = useInviteFamilyMember();

  const handleSubmit = () => {
    if (!email.trim()) return;
    invite.mutate({ email: email.trim(), role }, {
      onSuccess: () => {
        setEmail('');
        setRole('adult');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('family.inviteMember')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('common.email')}</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="member@example.com"
            />
          </div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!email.trim() || invite.isPending}>
            {t('family.sendInvite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
