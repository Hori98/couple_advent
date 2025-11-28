import { useEffect, useState, useCallback } from 'react';
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
      setError(err.message);
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { loading, session, emailSent, error, signInWithOtp, verifyEmailOtp, signInAnonymously, signOut };
}
