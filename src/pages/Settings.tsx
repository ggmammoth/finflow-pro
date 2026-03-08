import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Shield } from 'lucide-react';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          setFullName(data.full_name || '');
          setCurrency(data.currency || 'USD');
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, currency }).eq('user_id', user.id);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved successfully' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="card-premium border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base font-bold">Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input value={user?.email || ''} disabled className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</Label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" />
            </div>
            <Button onClick={handleSave} disabled={loading} className="mt-2">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="card-premium border-0 ring-1 ring-destructive/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="font-display text-base font-bold text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Signing out will end your current session. You can sign back in at any time.
            </p>
            <Button variant="destructive" onClick={signOut}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
