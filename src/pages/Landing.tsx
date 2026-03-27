import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, BarChart3, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Landing = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">MoneyBloom</span>
        </div>
        <div className="flex gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="gap-1.5">{t('landing.goToDashboard')} <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">{t('common.signIn')}</Button></Link>
              <Link to="/register"><Button size="sm" className="gap-1.5"><Sparkles className="h-3 w-3" /> {t('landing.getStarted')}</Button></Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {t('landing.badge')}
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
          {t('landing.heroTitle')}{' '}
          <span className="text-gradient">{t('landing.heroHighlight')}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {t('landing.heroDesc')}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={user ? '/dashboard' : '/register'}>
            <Button size="lg" className="h-11 gap-2 px-7 glow-primary">
              {user ? t('landing.goToDashboard') : t('landing.startFree')} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {!user && (
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-11 px-7">{t('common.signIn')}</Button>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BarChart3, title: t('landing.featureCharts'), desc: t('landing.featureChartsDesc') },
            { icon: RefreshCw, title: t('landing.featureRecurring'), desc: t('landing.featureRecurringDesc') },
            { icon: Shield, title: t('landing.featureSecurity'), desc: t('landing.featureSecurityDesc') },
          ].map((f, i) => (
            <div key={i} className="group rounded-xl border bg-card p-6 card-premium">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent transition-transform group-hover:scale-105">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        {t('landing.footer', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
};

export default Landing;
