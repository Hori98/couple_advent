import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'seen_onboarding_v1';

export function useFirstRun() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setSeen(v === '1'));
  }, []);

  const markSeen = useCallback(async () => {
    await AsyncStorage.setItem(KEY, '1');
    setSeen(true);
  }, []);

  return { seen, markSeen };
}

