import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useFirstRun } from '../hooks/useFirstRun';

export default function Index() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const { seen } = useFirstRun();

  useEffect(() => {
    if (loading || seen === null) return;
    if (!seen) {
      router.replace('/onboarding');
      return;
    }
    if (!session) router.replace('/auth');
    else router.replace('/pair');
  }, [loading, seen, session, router]);

  return (
    <View className="flex-1 items-center justify-center bg-christmas-night">
      <ActivityIndicator size="large" color="#fff" />
      <Text className="text-white mt-2">Loading...</Text>
    </View>
  );
}
