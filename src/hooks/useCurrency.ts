import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const CURRENCIES = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'RON', label: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', label: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { code: 'TRY', label: 'Turkish Lira', symbol: '₺' },
  { code: 'PLN', label: 'Polish Zloty', symbol: 'zł' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const useCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('currency')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.currency) setCurrency(data.currency as CurrencyCode);
      });
  }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const fmtCompact = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return { currency, setCurrency, fmt, fmtCompact };
};
