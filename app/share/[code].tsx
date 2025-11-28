import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REL_KEY = 'relationship_id';

export default function ShareClaimScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [status, setStatus] = useState<'init' | 'auth' | 'claim' | 'passcode' | 'done' | 'error'>('init');
  const [message, setMessage] = useState<string>('');
  const [passcode, setPasscode] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!code) return;
        setStatus('auth');
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
        }
        setStatus('claim');
        const { data: claimed, error } = await supabase.rpc('claim_share_link', { p_code: String(code) });
        if (error) {
          if (String(error.message).toLowerCase().includes('passcode')) {
            setStatus('passcode');
            return;
          }
          throw error;
        }
        // Persist relationship and go to calendar
        await AsyncStorage.setItem(REL_KEY, claimed.relationship_id);
        setStatus('done');
        router.replace('/calendar');
      } catch (e: any) {
        setMessage(e?.message ?? 'リンクの取得に失敗しました');
        setStatus('error');
      }
    })();
  }, [code, router]);

  return (
    <View className="flex-1 bg-christmas-night items-center justify-center p-6">
      {status !== 'error' && status !== 'passcode' ? (
        <>
          <ActivityIndicator color="#fff" />
          <Text className="text-white mt-3">
            {status === 'auth' && '準備中...'}
            {status === 'claim' && 'リンクを取得中...'}
            {status === 'init' && '読み込み中...'}
            {status === 'done' && '完了'}
          </Text>
        </>
      ) : status === 'error' ? (
        <>
          <Text className="text-red-300 text-center">{message}</Text>
          <TouchableOpacity onPress={() => router.replace('/')} className="mt-4 bg-white/10 px-4 py-2 rounded-xl">
            <Text className="text-white">ホームへ戻る</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-white text-lg mb-3">合言葉を入力してください</Text>
          <TextInput
            value={passcode}
            onChangeText={setPasscode}
            placeholder="合言葉"
            placeholderTextColor="#94a3b8"
            className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 w-full"
            secureTextEntry
          />
          <TouchableOpacity
            onPress={async () => {
              try {
                const { data: claimed, error } = await supabase.rpc('claim_share_link', {
                  p_code: String(code),
                  p_passcode: passcode,
                });
                if (error) throw error;
                await AsyncStorage.setItem(REL_KEY, claimed.relationship_id);
                router.replace('/calendar');
              } catch (e: any) {
                setMessage(e?.message ?? '合言葉が正しくありません');
              }
            }}
            className="mt-4 bg-christmas-green px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">開く</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
