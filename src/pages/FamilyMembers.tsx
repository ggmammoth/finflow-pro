import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Shield, User, Baby } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useFamilyMembers, useChildAllowances } from '@/hooks/useFamilyData';
import { useCurrency } from '@/hooks/useCurrency';
import InviteFamilyMemberDialog from '@/components/family/InviteFamilyMemberDialog';
import AllowanceDialog from '@/components/family/AllowanceDialog';

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Shield className="h-4 w-4" />,
  adult: <User className="h-4 w-4" />,
  child: <Baby className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  owner: 'bg-primary text-primary-foreground',
  adult: 'bg-secondary text-secondary-foreground',
  child: 'bg-accent text-accent-foreground',
};

export default function FamilyMembers() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { isOwner, hasFamily, familySpaceId } = useFamilyRole();
  const { data: members = [] } = useFamilyMembers();
  const { data: allowances = [] } = useChildAllowances();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [allowanceOpen, setAllowanceOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  if (!hasFamily) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>{t('family.noFamily')}</p>
      </div>
    );
  }

  const children = members.filter((m: any) => m.role === 'child');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t('family.members')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('family.membersSubtitle')}</p>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t('family.inviteMember')}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member: any) => {
          const memberAllowance = allowances.find((a: any) => a.child_member_id === member.id);
          return (
            <Card key={member.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {roleIcons[member.role]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.display_name || 'Member'}</p>
                      <Badge variant="secondary" className={`text-xs mt-0.5 ${roleColors[member.role]}`}>
                        {t(`family.role_${member.role}`)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {member.role === 'child' && (isOwner) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {memberAllowance ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {t('family.allowance')}: {fmt(Number(memberAllowance.amount))}/{memberAllowance.frequency}
                        </span>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                          setSelectedChildId(member.id);
                          setAllowanceOpen(true);
                        }}>
                          {t('common.edit')}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                        setSelectedChildId(member.id);
                        setAllowanceOpen(true);
                      }}>
                        {t('family.setAllowance')}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <InviteFamilyMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <AllowanceDialog
        open={allowanceOpen}
        onOpenChange={setAllowanceOpen}
        childMemberId={selectedChildId}
        existingAllowance={allowances.find((a: any) => a.child_member_id === selectedChildId) ?? null}
      />
    </div>
  );
}
