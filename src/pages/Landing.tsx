import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, BarChart3, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary glow-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">CashFlow</span>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button className="gap-2">Go to Dashboard <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" className="font-medium">Sign in</Button></Link>
              <Link to="/register"><Button className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Get Started</Button></Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-36">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium card-shadow">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Personal Finance Made Simple
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
          Take control of your{' '}
          <span className="text-gradient">finances</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Track income, expenses, subscriptions, and recurring payments all in one place. Beautiful charts, smart insights, and full control over your money.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to={user ? '/dashboard' : '/register'}>
            <Button size="lg" className="h-12 gap-2 px-8 text-base shadow-lg glow-primary">
              {user ? 'Dashboard' : 'Start Free'} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: BarChart3, title: 'Smart Dashboard', desc: 'Beautiful charts and summaries that give you instant clarity on your financial health.' },
            { icon: RefreshCw, title: 'Recurring Tracking', desc: 'Never miss a bill again. Automatically track subscriptions, rent, and recurring payments.' },
            { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and protected. Only you can access your financial information.' },
          ].map((f, i) => (
            <div key={i} className="group rounded-2xl border border-border/60 bg-card p-8 card-premium">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-transform group-hover:scale-110">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CashFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
