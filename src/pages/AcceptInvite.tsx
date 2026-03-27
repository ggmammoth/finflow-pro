import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAcceptFamilyInvite } from '@/hooks/useFamilyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const acceptInvite = useAcceptFamilyInvite();
  const [status, setStatus] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to login, then come back
      navigate(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`, { replace: true });
    }
  }, [user, authLoading, navigate, token]);

  const handleAccept = () => {
    if (!token) return;
    setStatus('accepting');
    acceptInvite.mutate(token, {
      onSuccess: () => {
        setStatus('success');
        setTimeout(() => navigate('/family', { replace: true }), 2000);
      },
      onError: (e: any) => {
        setStatus('error');
        setErrorMsg(e.message || 'Failed to accept invitation');
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Invalid invitation link. No token provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Family Invitation</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-muted-foreground">You've been invited to join a family space on MoneyBloom.</p>
              <Button onClick={handleAccept} size="lg" className="w-full">
                Accept Invitation
              </Button>
            </>
          )}
          {status === 'accepting' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Joining family...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-medium">You've joined the family!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive font-medium">{errorMsg}</p>
              <Button variant="outline" onClick={() => setStatus('idle')}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
