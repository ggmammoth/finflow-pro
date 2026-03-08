import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp } from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) return;
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="card-premium border-0 shadow-elevated">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary">
              <TrendingUp className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl font-extrabold tracking-tight">Create account</CardTitle>
            <CardDescription className="mt-1">Start tracking your finances today</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</Label>
                <Input id="name" placeholder="John Doe" className="h-11" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="h-11" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="h-11" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
