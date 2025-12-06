import { useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithOAuth, session } = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const nextPath = next && typeof next === 'string' ? decodeURIComponent(next) : '/creator/setup';

  // Avoid auto-redirect loop; navigate only after explicit success
  useEffect(() => {
    if (session) {
      router.replace(nextPath);
    }
  }, [session, router, nextPath]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0f172a' }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>🎄 Couple Advent</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>毎日にワクワクを。二人だけのカレンダー</Text>
        </View>

        {/* OAuth buttons */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => signInWithOAuth('google')} style={{
            width: '100%', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <AntDesign name="google" size={18} color="#0f172a" />
            <Text style={{ textAlign: 'center', color: '#0f172a', fontWeight: '700' }}>Googleで続行</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signInWithOAuth('apple')}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <FontAwesome5 name="apple" size={18} color="#fff" />
            <Text style={{ textAlign: 'center', color: '#fff' }}>Appleで続行</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            ログインには Google または Apple を使用してください。（メール/匿名は無効）
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
