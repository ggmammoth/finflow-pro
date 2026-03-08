import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="card-premium border-0 shadow-elevated text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl font-extrabold tracking-tight">{t('auth.checkYourEmail')}</CardTitle>
              <CardDescription className="mt-1">{t('auth.resetSentDesc')} <span className="font-medium text-foreground">{email}</span></CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">{t('auth.backToLogin')}</Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="card-premium border-0 shadow-elevated">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary">
              <TrendingUp className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl font-extrabold tracking-tight">{t('auth.resetPassword')}</CardTitle>
            <CardDescription className="mt-1">{t('auth.resetDesc')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('common.email')}</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="h-11" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.sendResetLink')}
              </Button>
              <Link to="/login" className="text-sm text-muted-foreground hover:underline">{t('auth.backToLogin')}</Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
