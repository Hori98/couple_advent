import { useEffect, useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Deep link → code exchange (OAuth / Magic Link 共通)
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      try {
        await supabase.auth.exchangeCodeForSession(url);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('exchangeCodeForSession error:', (e as any)?.message ?? e);
      }
    });
    return () => sub.remove();
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailOtpType: 'otp',
      },
    });
    if (err) {
      setError(err.message);
      return false;
    }
    setEmailSent(email);
    return true;
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple' | 'twitter') => {
    setError(null);
    const redirectTo = 'coupleadvent://auth/callback';
    try {
      const { data, error: err } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (err) throw err;
      // In React Native, we must open the returned URL ourselves
      const url = (data as any)?.url as string | undefined;
      if (url) {
        await Linking.openURL(url);
      } else {
        // eslint-disable-next-line no-console
        console.warn('No OAuth URL returned');
      }
    } catch (e: any) {
      setError(e?.message || 'OAuth sign-in failed');
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (err) {
      setError(err.message);
      return false;
    }
    setSession(data.session ?? null);
    return true;
  }, []);

  const signInAnonymously = useCallback(async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInAnonymously();
    if (err) {
      // Friendlier guidance when anonymous provider is disabled
      const msg = String(err.message || '');
      if (msg.toLowerCase().includes('disabled')) {
        setError('Anonymous sign-ins are disabled. Supabaseダッシュボードの Auth → Providers で Anonymous を有効化してください。');
      } else {
        setError(err.message);
      }
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { loading, session, emailSent, error, signInWithOtp, verifyEmailOtp, signInAnonymously, signOut, signInWithOAuth };
}
