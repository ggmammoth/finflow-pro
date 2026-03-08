import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, BarChart3, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">CashFlow</span>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button>Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
              <Link to="/register"><Button>Get Started</Button></Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center md:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Personal Finance Made Simple
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
          Take control of your <span className="text-gradient">finances</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Track income, expenses, subscriptions, and recurring payments all in one place. Beautiful charts, smart insights, and full control over your money.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to={user ? '/dashboard' : '/register'}>
            <Button size="lg" className="px-8">
              {user ? 'Dashboard' : 'Start Free'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-8 card-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold">Smart Dashboard</h3>
            <p className="mt-2 text-sm text-muted-foreground">Beautiful charts and summaries that give you instant clarity on your financial health.</p>
          </div>
          <div className="rounded-2xl border bg-card p-8 card-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold">Recurring Tracking</h3>
            <p className="mt-2 text-sm text-muted-foreground">Never miss a bill again. Automatically track subscriptions, rent, and recurring payments.</p>
          </div>
          <div className="rounded-2xl border bg-card p-8 card-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold">Secure & Private</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your data is encrypted and protected. Only you can access your financial information.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CashFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
