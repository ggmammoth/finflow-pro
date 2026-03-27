import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Users, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useFamilyInvitations } from '@/hooks/useFamilyData';

export default function FamilySettings() {
  const { t } = useTranslation();
  const { activeFamily, isOwner, hasFamily } = useFamilyRole();
  const { data: invitations = [] } = useFamilyInvitations();

  if (!hasFamily || !isOwner) {
    return <div className="py-20 text-center text-muted-foreground">{t('family.ownerOnly')}</div>;
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    expired: 'bg-muted text-muted-foreground',
    revoked: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {t('family.settings')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('family.settingsSubtitle')}</p>
      </div>

      {/* Family Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> {t('family.familyInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('family.familyName')}</span>
              <span className="text-sm font-medium">{activeFamily?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('family.createdAt')}</span>
              <span className="text-sm font-medium">{activeFamily?.created_at?.slice(0, 10)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> {t('family.invitations')}
          </CardTitle>
          <CardDescription>{t('family.invitationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('family.noInvitations')}</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{inv.invited_email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t('family.roleAssign')}: {inv.role_to_assign}</p>
                  </div>
                  <Badge className={`text-xs ${statusColors[inv.status] || ''}`}>
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
